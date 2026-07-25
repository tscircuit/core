import type {
  PcbManualEditConflictWarning,
  PcbPlacementError,
  PcbTraceError,
  PcbViaClearanceError,
} from "circuit-json"
import Debug from "debug"
import type { IRootCircuit } from "lib/IRootCircuit"
import type { RootCircuitEventName } from "lib/events"

const debug = Debug("tscircuit:renderable")

export const orderedRenderPhases = [
  "ReactSubtreesRender",
  "RenderIsolatedSubcircuits",
  "InflateSubcircuitCircuitJson",
  "SourceNameDuplicateComponentRemoval",
  "PcbFootprintStringRender",
  "FetchPartFootprint",
  "ResolveFootprintPinLabels",
  "InitializePortsFromChildren",
  "CreateNetsFromProps",
  "AssignFallbackProps",
  "CreateTracesFromProps",
  "CreateTracesFromNetLabels",
  "CreateTraceHintsFromProps",
  "CreateAutoplacedBreakoutPoints",
  "SourceGroupRender",
  "AssignNameToUnnamedComponents",
  "SourceRender",
  "CheckRefDesConvention",
  "SourceComponentPropertyValidation",
  "SourceParentAttachment",
  "PortMatching",
  "OptimizeSelectorCache",
  "SourceTraceRender",
  "SourceAddConnectivityMapKey",
  "SourceDesignRuleChecks",
  "SimulationRender",
  "SchematicComponentRender",
  "SchematicPortRender",
  "SymbolContainerRender",
  "SchematicPrimitiveRender",
  "SchematicSymbolResize",
  "SchematicComponentSizeCalculation",
  "SchematicLayout",
  "SchematicSectionRender",
  "SchematicTraceRender",
  "SchematicSheetRender",
  "SchematicReplaceNetLabelsWithSymbols",
  "PanelBoardLayout",
  "ValidatePcbCoordinates",
  "PcbComponentRender",
  "PcbPrimitiveRender",
  "PcbFootprintLayout",
  "PcbPortRender",
  "PcbPortAttachment",
  "PcbComponentSizeCalculation",
  "PcbComponentAnchorAlignment",
  "PcbCalcPlacementResolution",
  "PcbLayout",
  "PcbBoardAutoSize",
  "PanelLayout",
  "PcbAutoplaceBreakoutPoints",
  "PcbTraceHintRender",
  "PcbManualTraceRender",
  "PcbPlacementDesignRuleChecks",
  "PcbTraceRender",
  "PcbRouteNetIslands",
  "PcbCopperPourRender",
  "PcbDesignRuleChecks",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "PartsEngineRender",
  "SupplierFootprintMismatchWarning",
  "SimulationSpiceEngineRender",
] as const

export type RenderPhase = (typeof orderedRenderPhases)[number]

export const renderPhaseIndexMap = new Map<RenderPhase, number>(
  orderedRenderPhases.map((phase, index) => [phase, index]),
)

// Declare async dependencies between phases where later phases should wait for
// async effects originating in specific earlier phases to complete within the
// current component's subtree.
const asyncPhaseDependencies: Partial<Record<RenderPhase, RenderPhase[]>> = {
  InflateSubcircuitCircuitJson: ["RenderIsolatedSubcircuits"],
  ResolveFootprintPinLabels: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicComponentRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicPortRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SymbolContainerRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicPrimitiveRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicSymbolResize: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicComponentSizeCalculation: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  SchematicLayout: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicSectionRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicTraceRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicSheetRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SchematicReplaceNetLabelsWithSymbols: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbFootprintLayout: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbComponentSizeCalculation: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbLayout: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbBoardAutoSize: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbTraceHintRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbManualTraceRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbCopperPourRender: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbTraceRender",
    "PcbRouteNetIslands",
  ],
  PcbPlacementDesignRuleChecks: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbTraceRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbRouteNetIslands: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbDesignRuleChecks: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SilkscreenOverlapAdjustment: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  CadModelRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PartsEngineRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SupplierFootprintMismatchWarning: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PartsEngineRender",
  ],
  SourceAddConnectivityMapKey: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbComponentAnchorAlignment: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbCalcPlacementResolution: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  ValidatePcbCoordinates: ["PcbFootprintStringRender", "FetchPartFootprint"],
  SourceTraceRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
}

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

/**
 * Backing store for `renderPhaseStates`.
 *
 * Every Renderable used to allocate one `{ initialized, dirty }` object per
 * render phase in its constructor. With 63 phases that is 63 objects plus the
 * containing record for every component in the tree, which made the Renderable
 * constructor the single largest allocation site during generation.
 *
 * The flags now live in two `Uint8Array`s (one byte per phase each), and the
 * per-phase objects are materialized lazily and cached only for the phases a
 * caller actually touches. The public shape of `renderPhaseStates` is
 * unchanged: it still reads and writes as
 * `renderPhaseStates[phase].initialized` / `.dirty`, still enumerates every
 * phase, and still serializes identically in `getRenderGraph()`.
 */
class RenderPhaseStateStore {
  readonly initializedFlags: Uint8Array
  readonly dirtyFlags: Uint8Array
  private _views: Array<RenderPhaseStateView | undefined>

  constructor() {
    this.initializedFlags = new Uint8Array(orderedRenderPhases.length)
    this.dirtyFlags = new Uint8Array(orderedRenderPhases.length)
    this._views = new Array(orderedRenderPhases.length)
  }

  getView(phaseIndex: number): RenderPhaseStateView {
    let view = this._views[phaseIndex]
    if (view === undefined) {
      view = new RenderPhaseStateView(this, phaseIndex)
      this._views[phaseIndex] = view
    }
    return view
  }
}

/**
 * A live view onto one phase's flags. Reads and writes go straight to the
 * shared typed arrays, so this stays in sync with `_markDirty` and with any
 * other view of the same phase.
 */
class RenderPhaseStateView {
  constructor(
    private readonly _store: RenderPhaseStateStore,
    private readonly _phaseIndex: number,
  ) {}

  get initialized(): boolean {
    return this._store.initializedFlags[this._phaseIndex] === 1
  }

  set initialized(value: boolean) {
    this._store.initializedFlags[this._phaseIndex] = value ? 1 : 0
  }

  get dirty(): boolean {
    return this._store.dirtyFlags[this._phaseIndex] === 1
  }

  set dirty(value: boolean) {
    this._store.dirtyFlags[this._phaseIndex] = value ? 1 : 0
  }

  /** Keeps `JSON.stringify(getRenderGraph())` byte-identical to before. */
  toJSON() {
    return { initialized: this.initialized, dirty: this.dirty }
  }
}

/**
 * Compatibility view over the flag arrays, built only if something actually
 * reads `renderPhaseStates`. The hot paths (`runRenderPhase`, `_markDirty`)
 * read and write the typed arrays directly and never construct this.
 */
const createRenderPhaseStates = (
  store: RenderPhaseStateStore,
): RenderPhaseStates =>
  new Proxy({} as RenderPhaseStates, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined
      const phaseIndex = renderPhaseIndexMap.get(prop as RenderPhase)
      if (phaseIndex === undefined) return undefined
      return store.getView(phaseIndex)
    },
    has(_target, prop) {
      return (
        typeof prop === "string" && renderPhaseIndexMap.has(prop as RenderPhase)
      )
    },
    ownKeys() {
      return [...orderedRenderPhases]
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (
        typeof prop !== "string" ||
        !renderPhaseIndexMap.has(prop as RenderPhase)
      ) {
        return undefined
      }
      return {
        enumerable: true,
        configurable: true,
        value: store.getView(renderPhaseIndexMap.get(prop as RenderPhase)!),
      }
    },
  })

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

export type IRenderable = RenderPhaseFunctions & {
  renderPhaseStates: RenderPhaseStates
  runRenderPhase(phase: RenderPhase): void
  runRenderPhaseForChildren(phase: RenderPhase): void
  shouldBeRemoved: boolean
  children: IRenderable[]
  runRenderCycle(): void
}

let globalRenderCounter = 0
let globalAsyncEffectCounter = 0
export abstract class Renderable implements IRenderable {
  shouldBeRemoved = false
  children: IRenderable[]

  /** PCB-only SMTPads, PlatedHoles, Holes, Silkscreen elements etc. */
  isPcbPrimitive = false
  /** Schematic-only, lines, boxes, indicators etc. */
  isSchematicPrimitive = false

  _renderId: string
  _currentRenderPhase: RenderPhase | null = null

  private _asyncEffects: AsyncEffect[] = []

  parent: Renderable | null = null

  constructor(props: any) {
    this._renderId = `${globalRenderCounter++}`
    this.children = []
    this._renderPhaseStateStore = new RenderPhaseStateStore()
  }

  private _renderPhaseStateStore: RenderPhaseStateStore
  private _renderPhaseStatesView: RenderPhaseStates | null = null

  get renderPhaseStates(): RenderPhaseStates {
    if (this._renderPhaseStatesView === null) {
      this._renderPhaseStatesView = createRenderPhaseStates(
        this._renderPhaseStateStore,
      )
    }
    return this._renderPhaseStatesView
  }

  _markDirty(phase: RenderPhase) {
    // Mark all subsequent phases as dirty
    const phaseIndex = renderPhaseIndexMap.get(phase)!
    this._renderPhaseStateStore.dirtyFlags.fill(1, phaseIndex)

    if (this.parent?._markDirty) {
      this.parent._markDirty(phase)
    }
  }

  _queueAsyncEffect(effectName: string, effect: () => Promise<void>) {
    const asyncEffectId = `${this._renderId}:${globalAsyncEffectCounter++}`
    const asyncEffect: AsyncEffect = {
      asyncEffectId,
      promise: effect(), // TODO don't start effects until end of render cycle
      phase: this._currentRenderPhase!,
      effectName,
      complete: false,
    }
    this._asyncEffects.push(asyncEffect)

    const root = this._getRootCircuit()
    if (root) {
      root.emit("asyncEffect:start", {
        asyncEffectId,
        effectName,
        componentDisplayName: this.getString(),
        phase: asyncEffect.phase,
      })
    }

    // Set up completion handler
    asyncEffect.promise
      .then(() => {
        asyncEffect.complete = true
        // HACK: emit to the root circuit component that an async effect has completed
        const root = this._getRootCircuit()
        if (root) {
          root.emit("asyncEffect:end", {
            asyncEffectId,
            effectName,
            componentDisplayName: this.getString(),
            phase: asyncEffect.phase,
          })
        }
      })
      .catch((error) => {
        console.error(
          `Async effect error in ${asyncEffect.phase} "${effectName}":\n${error.stack}`,
        )
        asyncEffect.complete = true

        // HACK: emit to the root circuit component that an async effect has completed
        const root = this._getRootCircuit()
        if (root) {
          root.emit("asyncEffect:end", {
            asyncEffectId,
            effectName,
            componentDisplayName: this.getString(),
            phase: asyncEffect.phase,
            error: error.toString(),
          })
        }
      })
  }

  protected _emitRenderLifecycleEvent(
    phase: RenderPhase,
    startOrEnd: "start" | "end",
  ) {
    debug(`${phase}:${startOrEnd} ${this.getString()}`)
    const granular_event_type =
      `renderable:renderLifecycle:${phase}:${startOrEnd}` as RootCircuitEventName
    const eventPayload = {
      renderId: this._renderId,
      componentDisplayName: this.getString(),
      type: granular_event_type,
    }
    const root = this._getRootCircuit()
    if (root) {
      root.emit(granular_event_type, eventPayload)
      root.emit("renderable:renderLifecycle:anyEvent", {
        ...eventPayload,
        type: granular_event_type,
      })
    }
  }
  getString() {
    return this.constructor.name
  }

  _hasIncompleteAsyncEffects(): boolean {
    if (this._asyncEffects.some((effect) => !effect.complete)) return true

    return this.children.some((child) =>
      typeof (child as Renderable)._hasIncompleteAsyncEffects === "function"
        ? (child as Renderable)._hasIncompleteAsyncEffects()
        : false,
    )
  }

  _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase): boolean {
    // Check self
    for (const e of this._asyncEffects) {
      if (!e.complete && e.phase === phase) return true
    }
    // Check children
    for (const child of this.children) {
      const renderableChild = child as Renderable
      if (renderableChild._hasIncompleteAsyncEffectsInSubtreeForPhase(phase))
        return true
    }
    return false
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
    for (const renderPhase of orderedRenderPhases) {
      this.runRenderPhaseForChildren(renderPhase)
      this.runRenderPhase(renderPhase)
    }
  }

  /**
   * This runs all the render methods for a given phase, calling one of:
   * - doInitial*
   * - update*
   *  -remove*
   *  ...depending on the current state of the component.
   */
  runRenderPhase(phase: RenderPhase) {
    this._currentRenderPhase = phase
    const store = this._renderPhaseStateStore
    const phaseIndex = renderPhaseIndexMap.get(phase)!
    const isInitialized = store.initializedFlags[phaseIndex] === 1
    const isDirty = store.dirtyFlags[phaseIndex] === 1

    // Skip if component is being removed and not initialized
    if (!isInitialized && this.shouldBeRemoved) return

    if (this.shouldBeRemoved && isInitialized) {
      this._emitRenderLifecycleEvent(phase, "start")
      ;(this as any)?.[`remove${phase}`]?.()
      store.initializedFlags[phaseIndex] = 0
      store.dirtyFlags[phaseIndex] = 0
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }

    // Check for incomplete async effects from previous phases
    const prevPhaseIndex = phaseIndex - 1
    if (prevPhaseIndex >= 0) {
      const prevPhase = orderedRenderPhases[prevPhaseIndex]
      const hasIncompleteEffects = this._asyncEffects
        .filter((e) => e.phase === prevPhase)
        .some((e) => !e.complete)
      if (hasIncompleteEffects) return
    }

    // Check declared async dependencies for this phase within the entire tree
    const deps = asyncPhaseDependencies[phase] || []
    if (deps.length > 0) {
      for (const depPhase of deps) {
        if (this._hasIncompleteAsyncEffectsForPhase(depPhase)) {
          return
        }
      }
    }

    this._emitRenderLifecycleEvent(phase, "start")

    // Handle updates
    if (isInitialized) {
      if (isDirty) {
        ;(this as any)?.[`update${phase}`]?.()
        store.dirtyFlags[phaseIndex] = 0
      }
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }
    // Initial render
    store.dirtyFlags[phaseIndex] = 0
    ;(this as any)?.[`doInitial${phase}`]?.()
    store.initializedFlags[phaseIndex] = 1
    this._emitRenderLifecycleEvent(phase, "end")
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    for (const child of this.children) {
      // For isolated subcircuits, skip children during RenderIsolatedSubcircuits.
      // The children will be rendered in isolation and then inflated back.
      // After inflation, the new children should run all subsequent phases.
      // Only skip if the component has doInitialRenderIsolatedSubcircuits method
      // to actually handle the isolated rendering.
      if (
        "_isIsolatedSubcircuit" in this &&
        this._isIsolatedSubcircuit &&
        "doInitialRenderIsolatedSubcircuits" in this &&
        phase === "RenderIsolatedSubcircuits"
      ) {
        continue
      }
      child.runRenderPhaseForChildren(phase)
      child.runRenderPhase(phase)
    }
  }

  protected _getRootCircuit(): IRootCircuit | null {
    if ("root" in this) {
      return (this as { root?: IRootCircuit | null }).root ?? null
    }
    return null
  }

  renderError(
    message:
      | string
      | Omit<PcbTraceError, "pcb_error_id">
      | Omit<PcbPlacementError, "pcb_error_id">
      | Omit<PcbManualEditConflictWarning, "pcb_error_id">
      | Omit<PcbViaClearanceError, "pcb_error_id">,
  ) {
    // TODO add to render phase error list and try to add position or
    // relationships etc
    if (typeof message === "string") {
      throw new Error(message)
    }
    throw new Error(JSON.stringify(message, null, 2))
  }
}
