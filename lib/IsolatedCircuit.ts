import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PlatformConfig } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import Debug from "debug"
import * as Effect from "effect/Effect"
import { PreventSchedulerYield } from "effect/References"
import { type ReactElement, isValidElement } from "react"
import { type Matrix, identity } from "transformation-matrix"
import pkgJson from "../package.json"
import type { PrimitiveComponent } from "./components/base-components/PrimitiveComponent"
import {
  Renderable,
  type RenderPhase,
} from "./components/base-components/Renderable"
import { isAssemblyDeviceContainer } from "./components/base-components/is-assembly-device-container"
import type { BoardI } from "./components/normal-components/Board/BoardI"
import { Group } from "./components/primitive-components/Group"
import type { RootCircuitEventName } from "./events"
import { createInstanceFromReactElement } from "./fiber/create-instance-from-react-element"
import {
  createCircuitDatabaseEffect,
  useCircuitDatabase,
} from "./effect/circuit-database"
import { CircuitRuntime } from "./effect/circuit-runtime"
import {
  corePromise,
  coreSync,
  runCorePromise,
  runCoreSync,
} from "./effect/core-error"
import {
  CircuitEnvironment,
  type CircuitEnvironmentShape,
} from "./effect/core-services"
import {
  EffectFootprintLoader,
  type EffectFootprintLoadingOptions,
} from "./utils/footprint/effect-footprint-loader"
import {
  type RenderUntilSettledOptions,
  renderUntilSettledEffect as settleRenderEffect,
} from "./utils/render/render-until-settled"

export class IsolatedCircuit {
  firstChild: PrimitiveComponent | null = null
  children: PrimitiveComponent[]
  db: CircuitJsonUtilObjects
  root: IsolatedCircuit | null = null
  isRootCircuit = false

  /** Opt-in raw HTTP footprint scope; dispose this scope to cancel its jobs. */
  readonly experimentalFootprintLoader?: EffectFootprintLoader
  readonly effectRuntime: CircuitRuntime

  /**
   * Optional cache for isolated subcircuit circuit JSON, keyed by prop hash.
   * This is passed down from the RootCircuit when creating isolated circuits
   * for subcircuit rendering.
   */
  cachedSubcircuits?: Map<string, AnyCircuitElement[]>

  /**
   * Map to track pending renders by prop hash. This allows multiple subcircuits
   * with the same props to wait for a single render instead of each doing their own.
   */
  pendingSubcircuitRenders?: Map<string, Promise<AnyCircuitElement[]>>

  private _schematicDisabledOverride: boolean | undefined
  get schematicDisabled(): boolean {
    if (this._schematicDisabledOverride !== undefined) {
      return this._schematicDisabledOverride
    }

    if (this.platform?.schematicDisabled !== undefined) {
      return this.platform.schematicDisabled
    }

    const board = this._getBoard() as
      | { _parsedProps?: { schematicDisabled?: boolean } }
      | undefined

    return board?._parsedProps?.schematicDisabled ?? false
  }

  set schematicDisabled(value: boolean) {
    this._schematicDisabledOverride = value
  }
  pcbDisabled = false
  pcbRoutingDisabled = false

  _featureMspSchematicTraceRouting = true
  /** Allows board-level via stitching; set to false to disable globally. */
  _featurePcbViaStitching = true

  /**
   * The IsolatedCircuit name is usually set by the platform, it's not required but
   * if supplied can identify the circuit in certain effects, e.g. it is passed
   * as the display_name parameter for autorouting effects.
   */
  name?: string

  platform?: PlatformConfig

  /**
   * Optional URL pointing to where this project is hosted or documented.
   * When provided it is stored in the source_project_metadata.project_url field
   * of the generated Circuit JSON.
   */
  projectUrl?: string

  _hasRenderedAtleastOnce = false
  private _asyncEffectIdsByPhase = new Map<RenderPhase, Set<string>>()
  private _asyncEffectPhaseById = new Map<string, RenderPhase>()
  private _hasUnrenderedUpdatesFromAsyncEffects = false
  private _runningAsyncEffectsById = new Map<
    string,
    {
      asyncEffectId: string
      effectName?: string
      componentDisplayName?: string
      phase?: RenderPhase
      error?: string
    }
  >()

  constructor({
    platform,
    projectUrl,
    cachedSubcircuits,
    pendingSubcircuitRenders,
    experimentalFootprintLoading,
  }: {
    platform?: PlatformConfig
    projectUrl?: string
    cachedSubcircuits?: Map<string, AnyCircuitElement[]>
    pendingSubcircuitRenders?: Map<string, Promise<AnyCircuitElement[]>>
    experimentalFootprintLoading?: EffectFootprintLoadingOptions
  } = {}) {
    this.children = []
    this.db = runCoreSync(createCircuitDatabaseEffect())
    this.platform = platform
    this.projectUrl = projectUrl
    this.pcbDisabled = platform?.pcbDisabled ?? false
    this.pcbRoutingDisabled = platform?.routingDisabled ?? false
    this.cachedSubcircuits = cachedSubcircuits
    this.pendingSubcircuitRenders = pendingSubcircuitRenders
    this.root = this
    this.effectRuntime = new CircuitRuntime(() => this._effectEnvironment())
    this.effectRuntime.addFinalizer(() => {
      for (const event of Object.keys(
        this._eventListeners,
      ) as RootCircuitEventName[]) {
        this._eventListeners[event] = []
      }
      this._hasRenderLifecycleListeners = false
    })
    if (experimentalFootprintLoading) {
      this.experimentalFootprintLoader = new EffectFootprintLoader(
        experimentalFootprintLoading,
      )
      this.effectRuntime.addFinalizer(() =>
        this.experimentalFootprintLoader?.dispose(),
      )
    }
  }

  private _effectEnvironment(): CircuitEnvironmentShape {
    return {
      db: this.db,
      platform: this.platform,
      fetch: (url, options) => fetch(url, options),
    }
  }

  add(componentOrElm: PrimitiveComponent | ReactElement) {
    runCoreSync(this.addEffect(componentOrElm))
  }

  addEffect(componentOrElm: PrimitiveComponent | ReactElement) {
    return coreSync(() => {
      this.effectRuntime.assertOpen()
      let component: PrimitiveComponent
      if (isValidElement(componentOrElm)) {
        // TODO store subtree
        component = createInstanceFromReactElement(componentOrElm)
      } else {
        component = componentOrElm as PrimitiveComponent
      }
      this.children.push(component)
    }, "add_circuit_child")
  }

  setPlatform(platform: Partial<PlatformConfig>) {
    runCoreSync(this.setPlatformEffect(platform))
  }

  setPlatformEffect(platform: Partial<PlatformConfig>) {
    return coreSync(() => {
      this.effectRuntime.assertOpen()
      this.platform = {
        ...this.platform,
        ...platform,
      }
      if (platform.pcbDisabled !== undefined) {
        this.pcbDisabled = platform.pcbDisabled
      }
      if (platform.routingDisabled !== undefined) {
        this.pcbRoutingDisabled = platform.routingDisabled
      }
    }, "set_platform")
  }

  /**
   * Get the main board for this Circuit.
   */
  _getBoard(): (PrimitiveComponent & BoardI) | undefined {
    // `<assembly.device>` may contain the board, so the board is not always a
    // direct child. Descend through assembly-device containers only -- a board
    // nested inside an ordinary group is still not the circuit's root board.
    const findBoard = (
      components: PrimitiveComponent[],
    ): PrimitiveComponent | undefined => {
      for (const child of components) {
        if (child.componentName === "Board") return child
        if (isAssemblyDeviceContainer(child)) {
          const nested = findBoard(child.children)
          if (nested) return nested
        }
      }
      return undefined
    }

    return findBoard(this.children) as (PrimitiveComponent & BoardI) | undefined
  }

  _guessRootComponent() {
    if (this.firstChild) return
    if (this.children.length === 0) {
      throw new Error(
        "Not able to guess root component: IsolatedCircuit has no children (use circuit.add(...))",
      )
    }

    const panels = this.children.filter(
      (child) => child.lowercaseComponentName === "panel",
    )

    if (panels.length > 1) {
      throw new Error("Only one <panel> is allowed per circuit")
    }

    if (panels.length === 1) {
      if (this.children.length !== 1) {
        throw new Error("<panel> must be the root element of the circuit")
      }

      this.firstChild = panels[0]
      return
    }

    if (
      this.children.length === 1 &&
      (this.children[0].isGroup || isAssemblyDeviceContainer(this.children[0]))
    ) {
      this.firstChild = this.children[0]
      return
    }

    const group = new Group({ subcircuit: true })
    group.parent = this as any
    group.addAll(this.children)
    this.children = [group]
    this.firstChild = group
  }

  render() {
    runCoreSync(this.renderEffect())
  }

  renderEffect() {
    return Effect.provideService(
      Effect.uninterruptible(
        Effect.gen({ self: this }, function* () {
          const firstChild = yield* coreSync(() => {
            this.effectRuntime.assertOpen()
            if (!this.firstChild) this._guessRootComponent()
            if (!this.firstChild)
              throw new Error("IsolatedCircuit has no root component")
            // Public component parents historically also accept circuit roots.
            this.firstChild.parent = this as any
            return this.firstChild
          }, "prepare_render")
          if (
            firstChild.runRenderCycle === Renderable.prototype.runRenderCycle
          ) {
            yield* firstChild.runRenderCycleEffect()
          } else {
            yield* coreSync(
              () => firstChild.runRenderCycle(),
              "custom_render_cycle",
            )
          }
          yield* coreSync(() => {
            this._hasUnrenderedUpdatesFromAsyncEffects = false
            this._hasRenderedAtleastOnce = true
          }, "complete_render_cycle")
        }),
      ),
      PreventSchedulerYield,
      true,
    )
  }

  /**
   * Render through pending async updates. Experimental signal support cancels
   * this caller's wait only; component jobs continue and may commit later.
   */
  renderUntilSettled(options: RenderUntilSettledOptions = {}): Promise<void> {
    return runCorePromise(this.renderUntilSettledEffect(), options)
  }

  renderUntilSettledEffect() {
    return settleRenderEffect({
      circuit: this,
      prepareRender: () => {},
      prepareRenderEffect: () =>
        Effect.provideService(
          useCircuitDatabase((db) => {
            this.effectRuntime.assertOpen()
            const existing = db.source_project_metadata.list()?.[0]
            if (!existing) {
              db.source_project_metadata.insert({
                software_used_string: `@tscircuit/core@${this.getCoreVersion()}`,
                ...(this.projectUrl ? { project_url: this.projectUrl } : {}),
              })
            }
          }),
          CircuitEnvironment,
          this._effectEnvironment(),
        ),
      renderEffect: () =>
        this.render === IsolatedCircuit.prototype.render
          ? this.renderEffect()
          : coreSync(() => this.render(), "custom_render"),
      hasUnrenderedUpdates: () => this._hasUnrenderedUpdatesFromAsyncEffects,
      shouldRenderAfterWait: () =>
        this._hasUnrenderedUpdatesFromAsyncEffects ||
        this._asyncEffectPhaseById.size === 0,
    })
  }

  /** Interrupt owned jobs and release circuit resources exactly once. */
  dispose(): Promise<void> {
    return this.effectRuntime.dispose()
  }

  disposeEffect() {
    return Effect.uninterruptible(
      corePromise(() => this.dispose(), "dispose_circuit"),
    )
  }

  isDoneRendering(): boolean {
    return this._hasRenderedAtleastOnce && !this._hasIncompleteAsyncEffects()
  }

  _hasIncompleteAsyncEffects(): boolean {
    if (this._asyncEffectPhaseById.size > 0) return true
    if (this._hasUnrenderedUpdatesFromAsyncEffects) return true
    return this.children.some((child) => child._hasIncompleteAsyncEffects())
  }

  _hasIncompleteAsyncEffectsForPhase(phase: RenderPhase): boolean {
    return (this._asyncEffectIdsByPhase.get(phase)?.size ?? 0) > 0
  }

  getRunningAsyncEffects(): Array<{
    asyncEffectId: string
    effectName?: string
    componentDisplayName?: string
    phase?: RenderPhase
    error?: string
  }> {
    return Array.from(this._runningAsyncEffectsById.values())
  }

  getCircuitJson(): AnyCircuitElement[] {
    return runCoreSync(this.getCircuitJsonEffect())
  }

  getCircuitJsonEffect() {
    return Effect.gen({ self: this }, function* () {
      if (!this._hasRenderedAtleastOnce) {
        yield* this.render === IsolatedCircuit.prototype.render
          ? this.renderEffect()
          : coreSync(() => this.render(), "custom_render")
      }
      return yield* coreSync(() => this.db.toArray(), "read_circuit_json")
    })
  }

  toJson(): AnyCircuitElement[] {
    return this.getCircuitJson()
  }

  getSvg(options: {
    view: "pcb" | "schematic"
    layer?: string
  }): Promise<string> {
    return runCorePromise(this.getSvgEffect(options))
  }

  getSvgEffect(options: { view: "pcb" | "schematic"; layer?: string }) {
    return Effect.gen({ self: this }, function* () {
      const circuitToSvg = yield* corePromise(
        () =>
          import("circuit-to-svg").catch((e) => {
            throw new Error(
              `To use circuit.getSvg, you must install the "circuit-to-svg" package.\n\n"${e.message}"`,
            )
          }),
        "load_svg_renderer",
      )

      if (options.view === "pcb") {
        return yield* coreSync(
          () => circuitToSvg.convertCircuitJsonToPcbSvg(this.getCircuitJson()),
          "render_pcb_svg",
        )
      }
      if (options.view === "schematic") {
        return yield* coreSync(
          () =>
            circuitToSvg.convertCircuitJsonToSchematicSvg(
              this.getCircuitJson(),
            ),
          "render_schematic_svg",
        )
      }
      return yield* coreSync(() => {
        throw new Error(`Invalid view: ${options.view}`)
      }, "invalid_svg_view")
    })
  }

  getCoreVersion(): string {
    const [major, minor, patch] = pkgJson.version.split(".").map(Number)
    // We add one to the patch version because the build increments the version
    // after the build (it's a hack- won't work for major releases)
    return `${major}.${minor}.${patch + 1}`
  }

  async preview(
    previewNameOrOpts:
      | string
      | {
          previewName: string
          tscircuitApiKey?: string
        },
  ) {
    const previewOpts =
      typeof previewNameOrOpts === "object"
        ? previewNameOrOpts
        : { previewName: previewNameOrOpts }
    throw new Error("project.preview is not yet implemented")
  }

  computeSchematicGlobalTransform(): Matrix {
    return identity()
  }

  _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }

  selectAll(selector: string): PrimitiveComponent[] {
    return runCoreSync(this.selectAllEffect(selector))
  }

  selectAllEffect(selector: string) {
    return coreSync(() => {
      this._guessRootComponent()
      return this.firstChild?.selectAll(selector) ?? []
    }, "select_circuit_components")
  }
  selectOne(
    selector: string,
    opts?: { type?: "component" | "port" },
  ): PrimitiveComponent | null {
    return runCoreSync(this.selectOneEffect(selector, opts))
  }

  selectOneEffect(selector: string, opts?: { type?: "component" | "port" }) {
    return coreSync(() => {
      this._guessRootComponent()
      return this.firstChild?.selectOne(selector, opts) ?? null
    }, "select_circuit_component")
  }

  _hasRenderLifecycleListeners = false

  _eventListeners: Record<
    RootCircuitEventName,
    Array<(...args: any[]) => void>
  > = {} as Record<RootCircuitEventName, Array<(...args: any[]) => void>>

  emit(event: RootCircuitEventName, ...args: any[]) {
    if (event === "asyncEffect:start") {
      this._registerAsyncEffectStart(args[0] as { asyncEffectId?: string })
    } else if (event === "asyncEffect:end") {
      this._registerAsyncEffectEnd(args[0] as { asyncEffectId?: string })
    }
    if (!this._eventListeners[event]) return
    for (const listener of this._eventListeners[event]) {
      listener(...args)
    }
  }

  hasEventListener(event: RootCircuitEventName): boolean {
    return (this._eventListeners[event]?.length ?? 0) > 0
  }

  on(event: RootCircuitEventName, listener: (...args: any[]) => void) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = []
    }
    this._eventListeners[event]!.push(listener)
    if (event.startsWith("renderable:renderLifecycle:")) {
      this._hasRenderLifecycleListeners = true
    }
  }

  removeListener(
    event: RootCircuitEventName,
    listener: (...args: any[]) => void,
  ) {
    if (!this._eventListeners[event]) return
    this._eventListeners[event] = this._eventListeners[event]!.filter(
      (l) => l !== listener,
    )
    if (event.startsWith("renderable:renderLifecycle:")) {
      this._hasRenderLifecycleListeners = Object.entries(
        this._eventListeners,
      ).some(
        ([eventName, listeners]) =>
          eventName.startsWith("renderable:renderLifecycle:") &&
          listeners.length > 0,
      )
    }
  }

  enableDebug(debug: string | null | false) {
    if (typeof debug === "string") {
      Debug.enable(debug)
    } else if (debug === null || debug === false) {
      Debug.disable()
    }
  }

  getClientOrigin(): string {
    if (typeof window !== "undefined" && window.location) {
      return window.location.origin
    }
    if (typeof self !== "undefined" && (self as any).location) {
      return (self as any).location.origin
    }
    return ""
  }

  private _registerAsyncEffectStart(payload: {
    asyncEffectId?: string
    effectName?: string
    componentDisplayName?: string
    phase?: RenderPhase
    error?: string
  }) {
    if (!payload?.asyncEffectId || !payload.phase) return
    const { asyncEffectId, phase } = payload
    const existingPhase = this._asyncEffectPhaseById.get(asyncEffectId)
    if (existingPhase && existingPhase !== phase) {
      this._asyncEffectIdsByPhase.get(existingPhase)?.delete(asyncEffectId)
    }
    if (!this._asyncEffectIdsByPhase.has(phase)) {
      this._asyncEffectIdsByPhase.set(phase, new Set())
    }
    this._asyncEffectIdsByPhase.get(phase)!.add(asyncEffectId)
    this._asyncEffectPhaseById.set(asyncEffectId, phase)
    this._runningAsyncEffectsById.set(asyncEffectId, {
      asyncEffectId,
      effectName: payload.effectName,
      componentDisplayName: payload.componentDisplayName,
      phase,
      error: payload.error,
    })
  }

  private _registerAsyncEffectEnd(payload: {
    asyncEffectId?: string
    phase?: RenderPhase
  }) {
    if (!payload?.asyncEffectId) return
    const { asyncEffectId } = payload
    const phase = this._asyncEffectPhaseById.get(asyncEffectId) ?? payload.phase
    if (phase) {
      const phaseSet = this._asyncEffectIdsByPhase.get(phase)
      phaseSet?.delete(asyncEffectId)
      if (phaseSet && phaseSet.size === 0) {
        this._asyncEffectIdsByPhase.delete(phase)
      }
    }
    this._asyncEffectPhaseById.delete(asyncEffectId)
    this._runningAsyncEffectsById.delete(asyncEffectId)
    this._hasUnrenderedUpdatesFromAsyncEffects = true
  }
}
