import type {
  PcbManualEditConflictWarning,
  PcbPlacementError,
  PcbTraceError,
  PcbViaClearanceError,
} from "circuit-json"
import Debug from "debug"
import * as Effect from "effect/Effect"
import type { IRootCircuit } from "lib/IRootCircuit"
import { CircuitRuntime } from "lib/effect/circuit-runtime"
import { corePromise, coreSync, runCoreSync } from "lib/effect/core-error"
import type { CoreError } from "lib/effect/core-error"
import type { CoreJobContext, CoreJobServices } from "lib/effect/core-services"
import {
  type RenderPhase,
  orderedRenderPhases,
  renderPhaseIndexMap,
} from "lib/effect/render-phase-definitions"
import {
  markRenderPhasesDirtyEffect,
  renderChildrenEffect,
  renderCycleEffect,
  renderPhaseEffect,
} from "lib/effect/render-phase-programs"
import type { RootCircuitEventName } from "lib/events"

const debug = Debug("tscircuit:renderable")

export {
  orderedRenderPhases,
  renderPhaseIndexMap,
  type RenderPhase,
} from "lib/effect/render-phase-definitions"

export type RenderPhaseFn<K extends RenderPhase = RenderPhase> =
  | `doInitial${K}`
  | `update${K}`
  | `remove${K}`

export type RenderPhaseStates = Record<
  RenderPhase,
  {
    initialized: boolean
    dirty: boolean
  }
>

export type AsyncEffect = {
  asyncEffectId: string
  effectName: string
  promise: Promise<void>
  phase: RenderPhase
  complete: boolean
}

export type RenderPhaseFunctions = {
  [T in RenderPhaseFn]?: () => void
}

type RenderJobBuilder = (
  job: CoreJobContext,
) => Effect.Effect<void, unknown, CoreJobServices>

export type IRenderable = RenderPhaseFunctions & {
  renderPhaseStates: RenderPhaseStates
  runRenderPhase(phase: RenderPhase): void
  runRenderPhaseForChildren(phase: RenderPhase): void
  shouldBeRemoved: boolean
  children: IRenderable[]
  runRenderCycle(): void
  _hasIncompleteAsyncEffects?(): boolean
  _hasIncompleteAsyncEffectsInSubtreeForPhase?(phase: RenderPhase): boolean
}

let globalRenderCounter = 0
let globalAsyncEffectCounter = 0
export abstract class Renderable implements IRenderable {
  private _phaseStatesByName?: RenderPhaseStates
  private readonly _phaseStatesByIndex: RenderPhaseStates[RenderPhase][]

  // Build the named map once, sharing the state objects used by the render loop.
  // Once exposed, use the map so callers can also replace individual entries.
  get renderPhaseStates(): RenderPhaseStates {
    if (!this._phaseStatesByName) {
      this._phaseStatesByName = Object.fromEntries(
        orderedRenderPhases.map((phase, index) => [
          phase,
          this._phaseStatesByIndex[index],
        ]),
      ) as RenderPhaseStates
    }
    return this._phaseStatesByName
  }

  set renderPhaseStates(states: RenderPhaseStates) {
    this._phaseStatesByName = states
  }

  shouldBeRemoved = false
  children: IRenderable[]

  /** PCB-only SMTPads, PlatedHoles, Holes, Silkscreen elements etc. */
  isPcbPrimitive = false
  /** Schematic-only, lines, boxes, indicators etc. */
  isSchematicPrimitive = false

  _renderId: string
  _currentRenderPhase: RenderPhase | null = null
  _pcbTraceRenderWaitingForPlacementChecks = false

  private _asyncEffects: AsyncEffect[] = []
  private _standaloneEffectRuntime?: CircuitRuntime

  parent: Renderable | null = null

  constructor(props: any) {
    this._renderId = `${globalRenderCounter++}`
    this.children = []
    this._phaseStatesByIndex = Array.from(
      { length: orderedRenderPhases.length },
      () => ({
        initialized: false,
        dirty: false,
      }),
    )
  }

  _markDirty(phase: RenderPhase) {
    runCoreSync(this._markDirtyEffect(phase))
  }

  _markDirtyEffect(phase: RenderPhase): Effect.Effect<void, CoreError> {
    return markRenderPhasesDirtyEffect({
      renderable: this,
      phase,
      getState: (dirtyPhase) => this._getPhaseState(dirtyPhase),
    })
  }

  private _getPhaseState(phase: RenderPhase) {
    return (
      this._phaseStatesByName?.[phase] ??
      this._phaseStatesByIndex[renderPhaseIndexMap.get(phase)!]
    )
  }

  private _getEffectRuntime() {
    const circuitRuntime = this._getRootCircuit()?.effectRuntime
    if (circuitRuntime) return circuitRuntime
    this._standaloneEffectRuntime ??= new CircuitRuntime(() => ({
      fetch: (url, options) => fetch(url, options),
    }))
    return this._standaloneEffectRuntime
  }

  /** Cancel subtree jobs in existing circuit and standalone ownership scopes. */
  cancelPendingEffects(): void {
    const runtimes = new Set<CircuitRuntime>()
    const circuitRuntime = this._getRootCircuit()?.effectRuntime
    if (circuitRuntime) runtimes.add(circuitRuntime)
    // A standalone parent may register a job for a logical child owner.
    for (
      let ancestor: Renderable | null = this;
      ancestor;
      ancestor = ancestor.parent
    ) {
      if (ancestor._standaloneEffectRuntime)
        runtimes.add(ancestor._standaloneEffectRuntime)
    }
    // Standalone descendants may each have acquired their own lazy runtime.
    const pending: Renderable[] = [this]
    const visited = new Set<Renderable>()
    while (pending.length > 0) {
      const component = pending.pop()!
      if (visited.has(component)) continue
      visited.add(component)
      if (component._standaloneEffectRuntime)
        runtimes.add(component._standaloneEffectRuntime)
      for (const child of component.children) {
        if (child instanceof Renderable) pending.push(child)
      }
    }
    for (const runtime of runtimes) runtime.cancelSubtree(this)
  }

  _queueEffect(
    effectName: string,
    buildOrOwnership:
      | RenderJobBuilder
      | {
          readonly owner: Renderable
          readonly build: RenderJobBuilder
        },
  ) {
    const asyncEffectId = `${this._renderId}:${globalAsyncEffectCounter++}`
    const ownership =
      typeof buildOrOwnership === "function"
        ? { owner: this, build: buildOrOwnership }
        : buildOrOwnership
    const promise = this._getEffectRuntime().queue(ownership)
    this._registerAsyncEffect({ asyncEffectId, effectName, promise })
  }

  /**
   * External compatibility adapter. The callback starts eagerly and a thrown
   * value escapes before a record is registered, as in the original API.
   * Observe the original Promise as well as its owned job so ordinary completion
   * retains its first-microtask ordering and interruption still settles records.
   */
  _queueAsyncEffect(effectName: string, effect: () => Promise<void>) {
    const asyncEffectId = `${this._renderId}:${globalAsyncEffectCounter++}`
    const originalPromise = effect()
    const promise = this._getEffectRuntime().queue({
      owner: this,
      build: () => corePromise(() => originalPromise, effectName),
    })
    this._registerAsyncEffect({
      asyncEffectId,
      effectName,
      promise,
      originalPromise,
    })
  }

  private _registerAsyncEffect(context: {
    asyncEffectId: string
    effectName: string
    promise: Promise<void>
    originalPromise?: Promise<void>
  }) {
    const { asyncEffectId, effectName, promise, originalPromise } = context
    const asyncEffect: AsyncEffect = {
      asyncEffectId,
      promise,
      phase: this._currentRenderPhase!,
      effectName,
      complete: false,
    }
    this._asyncEffects.push(asyncEffect)
    // Completion belongs to the circuit that registered the phase record,
    // including when the invoking component is detached or reparented.
    const registrationRoot = this._getRootCircuit()

    const finish = (result: { error?: unknown; failed: boolean }) => {
      if (asyncEffect.complete) return
      asyncEffect.complete = true
      this._asyncEffects = this._asyncEffects.filter(
        (pendingEffect) => pendingEffect !== asyncEffect,
      )
      if (result.failed) {
        const errorDescription =
          result.error instanceof Error
            ? result.error.stack
            : String(result.error)
        console.error(
          `Async effect error in ${asyncEffect.phase} "${effectName}":\n${errorDescription}`,
        )
      }
      registrationRoot?.emit("asyncEffect:end", {
        asyncEffectId,
        effectName,
        componentDisplayName: this.getString(),
        phase: asyncEffect.phase,
        ...(result.failed ? { error: String(result.error) } : {}),
      })
    }
    const observeCompletion = (completion: Promise<void>) => {
      completion
        .then(
          () => finish({ failed: false }),
          (error) => finish({ failed: true, error }),
        )
        .catch((notificationFailure) => {
          // Terminal records and scopes are already released. A failing listener
          // is a notification failure: report it once without reclassifying the
          // job, emitting another end event or creating an unhandled rejection.
          const description =
            notificationFailure instanceof Error
              ? notificationFailure.stack
              : String(notificationFailure)
          console.error(
            `Async effect completion notification error in ${asyncEffect.phase} "${effectName}":\n${description}`,
          )
        })
    }
    observeCompletion(promise)
    if (originalPromise) observeCompletion(originalPromise)
    registrationRoot?.emit("asyncEffect:start", {
      asyncEffectId,
      effectName,
      componentDisplayName: this.getString(),
      phase: asyncEffect.phase,
    })
  }

  protected _emitRenderLifecycleEvent(
    phase: RenderPhase,
    startOrEnd: "start" | "end",
  ) {
    const root = this._getRootCircuit()
    if (root?._hasRenderLifecycleListeners === false && !debug.enabled) return
    const granular_event_type =
      `renderable:renderLifecycle:${phase}:${startOrEnd}` as RootCircuitEventName
    // Older/custom root implementations without listener inspection still receive events.
    const hasListeners =
      root &&
      (!root.hasEventListener ||
        root.hasEventListener(granular_event_type) ||
        root.hasEventListener("renderable:renderLifecycle:anyEvent"))
    if (!debug.enabled && !hasListeners) return

    const componentDisplayName = this.getString()
    if (debug.enabled) debug(`${phase}:${startOrEnd} ${componentDisplayName}`)
    if (!hasListeners) return

    const eventPayload = {
      renderId: this._renderId,
      componentDisplayName,
      type: granular_event_type,
    }
    root.emit(granular_event_type, eventPayload)
    root.emit("renderable:renderLifecycle:anyEvent", {
      ...eventPayload,
      type: granular_event_type,
    })
  }
  getString() {
    return this.constructor.name
  }

  _hasIncompleteAsyncEffects(): boolean {
    return runCoreSync(this._hasIncompleteAsyncEffectsEffect())
  }

  getPendingAsyncEffectNames(): readonly string[] {
    return this._asyncEffects.map((pendingEffect) => pendingEffect.effectName)
  }

  _hasIncompleteAsyncEffectsEffect(): Effect.Effect<boolean, CoreError> {
    const renderable = this
    return Effect.gen(function* () {
      if (renderable._asyncEffects.length > 0) return true
      for (const child of renderable.children) {
        if (
          child instanceof Renderable &&
          child._hasIncompleteAsyncEffects ===
            Renderable.prototype._hasIncompleteAsyncEffects
        ) {
          if (yield* child._hasIncompleteAsyncEffectsEffect()) return true
        } else if (
          "_hasIncompleteAsyncEffects" in child &&
          typeof child._hasIncompleteAsyncEffects === "function"
        ) {
          const queryChildJobs = child._hasIncompleteAsyncEffects
          if (
            yield* coreSync(
              () => queryChildJobs.call(child),
              "custom_incomplete_jobs",
            )
          ) {
            return true
          }
        }
      }
      return false
    })
  }

  _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase): boolean {
    return runCoreSync(
      this._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(phase),
    )
  }

  _hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(
    phase: RenderPhase,
  ): Effect.Effect<boolean, CoreError> {
    const renderable = this
    return Effect.gen(function* () {
      if (
        renderable._asyncEffects.some(
          (pendingEffect) => pendingEffect.phase === phase,
        )
      ) {
        return true
      }
      for (const child of renderable.children) {
        if (
          child instanceof Renderable &&
          child._hasIncompleteAsyncEffectsInSubtreeForPhase ===
            Renderable.prototype._hasIncompleteAsyncEffectsInSubtreeForPhase
        ) {
          if (
            yield* child._hasIncompleteAsyncEffectsInSubtreeForPhaseEffect(
              phase,
            )
          ) {
            return true
          }
        } else {
          if (
            yield* coreSync(
              () => child._hasIncompleteAsyncEffectsInSubtreeForPhase!(phase),
              "custom_subtree_jobs",
            )
          ) {
            return true
          }
        }
      }
      return false
    })
  }

  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean {
    const root = this._getRootCircuit()
    if (root?._hasIncompleteAsyncEffectsForPhase) {
      return root._hasIncompleteAsyncEffectsForPhase(phase)
    }
    return this._hasIncompleteAsyncEffectsInSubtreeForPhase(phase)
  }

  getCurrentRenderPhase(): RenderPhase | null {
    return this._currentRenderPhase
  }

  getRenderGraph(): Record<string, any> {
    return {
      id: this._renderId,
      currentPhase: this._currentRenderPhase,
      renderPhaseStates: this.renderPhaseStates,
      shouldBeRemoved: this.shouldBeRemoved,
      children: this.children.map((child) =>
        (child as Renderable).getRenderGraph(),
      ),
    }
  }

  getTopLevelRenderable(): Renderable {
    let current: Renderable = this
    while (current.parent && current.parent instanceof Renderable) {
      current = current.parent
    }
    return current
  }

  runRenderCycle() {
    runCoreSync(this.runRenderCycleEffect())
  }

  runRenderCycleEffect(): Effect.Effect<void, CoreError> {
    return renderCycleEffect(this)
  }

  /** Run the Effect phase program through the existing synchronous boundary. */
  runRenderPhase(phase: RenderPhase) {
    runCoreSync(this.runRenderPhaseEffect(phase))
  }

  runRenderPhaseEffect(phase: RenderPhase): Effect.Effect<void, CoreError> {
    return renderPhaseEffect({
      renderable: this,
      phase,
      getState: () => this._getPhaseState(phase),
      hasPreviousPhaseJobs: () => {
        const previousPhaseIndex = renderPhaseIndexMap.get(phase)! - 1
        if (previousPhaseIndex < 0) return false
        const previousPhase = orderedRenderPhases[previousPhaseIndex]
        return this._asyncEffects.some(
          (pendingEffect) => pendingEffect.phase === previousPhase,
        )
      },
      cancelRemovedJobs: () => this.cancelPendingEffects(),
      emitLifecycle: (startOrEnd) =>
        this._emitRenderLifecycleEvent(phase, startOrEnd),
    })
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    runCoreSync(this.runRenderPhaseForChildrenEffect(phase))
  }

  runRenderPhaseForChildrenEffect(
    phase: RenderPhase,
  ): Effect.Effect<void, CoreError> {
    return renderChildrenEffect({ renderable: this, phase })
  }

  protected _getRootCircuit(): IRootCircuit | null {
    if ("root" in this) {
      return (this as { root?: IRootCircuit | null }).root ?? null
    }
    return null
  }

  renderErrorEffect(
    message:
      | string
      | Omit<PcbTraceError, "pcb_error_id">
      | Omit<PcbPlacementError, "pcb_error_id">
      | Omit<PcbManualEditConflictWarning, "pcb_error_id">
      | Omit<PcbViaClearanceError, "pcb_error_id">,
  ): Effect.Effect<void, CoreError> {
    return coreSync(() => {
      if (typeof message === "string") throw new Error(message)
      throw new Error(JSON.stringify(message, null, 2))
    }, "render_error")
  }

  renderError(message: Parameters<Renderable["renderErrorEffect"]>[0]) {
    runCoreSync(this.renderErrorEffect(message))
  }
}
