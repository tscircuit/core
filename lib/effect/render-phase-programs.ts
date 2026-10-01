import * as Effect from "effect/Effect"
import {
  type IRenderable,
  type RenderPhaseFunctions,
  type RenderPhaseStates,
  Renderable,
} from "../components/base-components/Renderable"
import { type CoreError, atomicCoreEffect, coreSync } from "./core-error"
import { prefersNativeMethod } from "./override-dispatch"
import {
  type RenderPhase,
  asyncPhaseDependencies,
  orderedRenderPhases,
  renderPhaseIndexMap,
} from "./render-phase-definitions"

export interface RenderPhaseContext {
  readonly renderable: Renderable
  readonly phase: RenderPhase
  resumeInterruptedPhase?(): void
  getState(): RenderPhaseStates[RenderPhase]
  hasPreviousPhaseJobs(): boolean
  cancelRemovedJobs(): void
  emitLifecycle(startOrEnd: "start" | "end"): void
}

/** Compatibility name for existing internal consumers of the atomic policy. */
export { atomicCoreEffect as atomicRenderEffect }

/**
 * A phase is a sequential Effect program: enter, gate, invoke a domain hook,
 * transition the captured state, then publish completion. Hooks remain
 * synchronous adapters so existing subclasses keep their extension contract.
 */
export function renderPhaseEffect(context: RenderPhaseContext) {
  return atomicCoreEffect(
    Effect.gen(function* () {
      const { renderable, phase } = context
      const plan = yield* coreSync(
        () => prepareRenderPhase(context),
        `prepare_${phase}`,
      )
      if (!plan) return

      const { action, state } = plan
      yield* coreSync(() => context.emitLifecycle("start"), `start_${phase}`)
      if (action === "initial") {
        state.dirty = false
        yield* invokePhaseHookEffect({
          renderable,
          method: `doInitial${phase}`,
        })
        state.initialized = true
      } else if (action === "update") {
        yield* invokePhaseHookEffect({ renderable, method: `update${phase}` })
        state.dirty = false
      } else if (action === "remove") {
        yield* invokePhaseHookEffect({ renderable, method: `remove${phase}` })
        state.initialized = false
        state.dirty = false
      }
      yield* coreSync(() => context.emitLifecycle("end"), `end_${phase}`)
    }),
  )
}

type RenderPhasePlan = {
  action: "initial" | "update" | "remove" | "clean"
  state: RenderPhaseStates[RenderPhase]
}

/**
 * Capture the state and flags before consulting gates or lifecycle observers.
 * The transition keeps this state entry even if a hook replaces the public map.
 */
function prepareRenderPhase(
  context: RenderPhaseContext,
): RenderPhasePlan | undefined {
  const { renderable, phase } = context
  renderable._currentRenderPhase = phase
  context.resumeInterruptedPhase?.()
  // Revival's dirty override may replace the public state entry or map.
  const state = context.getState()
  const { initialized, dirty } = state
  if (renderable.shouldBeRemoved) {
    context.cancelRemovedJobs()
    return initialized ? { action: "remove", state } : undefined
  }
  if (context.hasPreviousPhaseJobs()) return
  for (const dependency of asyncPhaseDependencies[phase] ?? []) {
    if (renderable._hasIncompleteAsyncEffectsForPhase(dependency)) return
  }
  if (initialized && !dirty) return { action: "clean", state }
  return { action: initialized ? "update" : "initial", state }
}

function invokePhaseHookEffect(context: {
  renderable: Renderable
  method: keyof RenderPhaseFunctions
}) {
  return coreSync(() => {
    const hook = (context.renderable as RenderPhaseFunctions)[context.method]
    hook?.call(context.renderable)
  }, context.method)
}

/** Sequential iteration retains live array semantics when a hook adds children. */
export function renderChildrenEffect(context: {
  renderable: Renderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return atomicCoreEffect(
    Effect.suspend(() => {
      const { renderable, phase } = context
      return Effect.forEach(
        renderable.children,
        (child) =>
          Effect.suspend(() => {
            if (
              phase === "RenderIsolatedSubcircuits" &&
              "_isIsolatedSubcircuit" in renderable &&
              renderable._isIsolatedSubcircuit &&
              "doInitialRenderIsolatedSubcircuits" in renderable
            )
              return Effect.void
            return Effect.andThen(
              dispatchRenderChildrenEffect({ renderable: child, phase }),
              dispatchRenderPhaseEffect({ renderable: child, phase }),
            )
          }),
        { discard: true },
      )
    }),
  )
}

export function renderCycleEffect(
  renderable: Renderable,
): Effect.Effect<void, CoreError> {
  return atomicCoreEffect(
    Effect.forEach(
      orderedRenderPhases,
      (phase) =>
        Effect.andThen(
          dispatchRenderChildrenEffect({ renderable, phase }),
          dispatchRenderPhaseEffect({ renderable, phase }),
        ),
      { discard: true },
    ),
  )
}

/**
 * A native hook wins when provided. Otherwise preserve a subclass's existing
 * synchronous override instead of bypassing it during Effect traversal.
 */
export function dispatchRenderPhaseEffect(context: {
  renderable: IRenderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return Effect.suspend(() => {
    const { renderable, phase } = context
    if (
      renderable instanceof Renderable &&
      prefersNativeMethod(renderable, "runRenderPhase", "runRenderPhaseEffect")
    ) {
      return renderable.runRenderPhaseEffect(phase)
    }
    return coreSync(
      () => renderable.runRenderPhase(phase),
      `custom_phase_${phase}`,
    )
  })
}

export function dispatchRenderChildrenEffect(context: {
  renderable: IRenderable
  phase: RenderPhase
}): Effect.Effect<void, CoreError> {
  return Effect.suspend(() => {
    const { renderable, phase } = context
    if (
      renderable instanceof Renderable &&
      prefersNativeMethod(
        renderable,
        "runRenderPhaseForChildren",
        "runRenderPhaseForChildrenEffect",
      )
    ) {
      return renderable.runRenderPhaseForChildrenEffect(phase)
    }
    return coreSync(
      () => renderable.runRenderPhaseForChildren(phase),
      `custom_children_${phase}`,
    )
  })
}

export function markRenderPhasesDirtyEffect(context: {
  renderable: Renderable
  phase: RenderPhase
  getState(phase: RenderPhase): RenderPhaseStates[RenderPhase]
}): Effect.Effect<void, CoreError> {
  return atomicCoreEffect(
    Effect.gen(function* () {
      const { renderable, phase } = context
      yield* Effect.sync(() => {
        const phaseIndex = renderPhaseIndexMap.get(phase)
        if (phaseIndex === undefined) return
        for (const dirtyPhase of orderedRenderPhases.slice(phaseIndex)) {
          context.getState(dirtyPhase).dirty = true
        }
      })
      const { parent } = renderable
      if (!parent?._markDirty) return
      if (
        parent instanceof Renderable &&
        prefersNativeMethod(parent, "_markDirty", "_markDirtyEffect")
      ) {
        yield* parent._markDirtyEffect(phase)
      } else {
        yield* coreSync(() => parent._markDirty(phase), `custom_dirty_${phase}`)
      }
    }),
  )
}
