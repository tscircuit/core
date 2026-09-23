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
  "SchematicLabelNetsWithConflictingNames",
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
  "PcbFlexRender",
  "PcbAutoplaceBreakoutPoints",
  "PcbTraceHintRender",
  "PcbManualTraceRender",
  "PcbPlacementDesignRuleChecks",
  "PcbTraceRender",
  "PcbRouteNetIslands",
  "PcbImplicitCopperPourRender",
  "PcbCopperPourRender",
  "PcbViaStitchRender",
  "PcbCopperPourCleanup",
  "PcbDesignRuleChecks",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "PartsEngineRender",
  "PartOrientationAnalysis",
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
  SchematicLabelNetsWithConflictingNames: [
    "RenderIsolatedSubcircuits",
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "SchematicTraceRender",
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
    "PcbPlacementDesignRuleChecks",
    "PcbTraceRender",
    "PcbRouteNetIslands",
    "PcbImplicitCopperPourRender",
  ],
  PcbImplicitCopperPourRender: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbPlacementDesignRuleChecks",
    "PcbTraceRender",
    "PcbRouteNetIslands",
  ],
  PcbViaStitchRender: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbPlacementDesignRuleChecks",
    "PcbTraceRender",
    "PcbRouteNetIslands",
    "PcbImplicitCopperPourRender",
    "PcbCopperPourRender",
  ],
  PcbPlacementDesignRuleChecks: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  PcbCopperPourCleanup: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbPlacementDesignRuleChecks",
    "PcbTraceRender",
    "PcbRouteNetIslands",
    "PcbImplicitCopperPourRender",
    "PcbCopperPourRender",
    "PcbViaStitchRender",
  ],
  PcbTraceRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PcbRouteNetIslands: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbPlacementDesignRuleChecks",
  ],
  PcbDesignRuleChecks: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PcbPlacementDesignRuleChecks",
    "PcbTraceRender",
    "PcbImplicitCopperPourRender",
    "PcbCopperPourRender",
    "PcbViaStitchRender",
    "PcbCopperPourCleanup",
  ],
  SilkscreenOverlapAdjustment: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
  ],
  CadModelRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PartsEngineRender: ["PcbFootprintStringRender", "FetchPartFootprint"],
  PartOrientationAnalysis: [
    "PcbFootprintStringRender",
    "FetchPartFootprint",
    "PartsEngineRender",
  ],
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

const PHASE_INITIALIZED = 1
const PHASE_DIRTY = 2

let globalRenderCounter = 0
let globalAsyncEffectCounter = 0
export abstract class Renderable implements IRenderable {
  private _renderPhaseStates?: RenderPhaseStates
  private _renderPhaseFlags: Uint8Array

  // Most components never expose their phase state. Keep the hot path compact,
  // then preserve the public mutable object API once a caller inspects it.
  get renderPhaseStates(): RenderPhaseStates {
    if (!this._renderPhaseStates) {
      this._renderPhaseStates = Object.fromEntries(
        orderedRenderPhases.map((phase, index) => [
          phase,
          {
            initialized:
              (this._renderPhaseFlags[index] & PHASE_INITIALIZED) !== 0,
            dirty: (this._renderPhaseFlags[index] & PHASE_DIRTY) !== 0,
          },
        ]),
      ) as RenderPhaseStates
    }
    return this._renderPhaseStates
  }

  set renderPhaseStates(states: RenderPhaseStates) {
    this._renderPhaseStates = states
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

  parent: Renderable | null = null

  constructor(props: any) {
    this._renderId = `${globalRenderCounter++}`
    this.children = []
    this._renderPhaseFlags = new Uint8Array(orderedRenderPhases.length)
  }

  /** Centralize writes to compact state and the public mutable view. */
  private _setRenderPhaseFlag(
    phaseIndex: number,
    flag: typeof PHASE_INITIALIZED | typeof PHASE_DIRTY,
    value: boolean,
    observedState?: RenderPhaseStates[RenderPhase],
  ) {
    if (value) this._renderPhaseFlags[phaseIndex] |= flag
    else this._renderPhaseFlags[phaseIndex] &= ~flag

    // A handler can materialize the public view during this phase. If the view
    // already existed, keep updating the same state object captured on entry.
    const state =
      observedState ??
      this._renderPhaseStates?.[orderedRenderPhases[phaseIndex]]
    if (!state) return
    if (flag === PHASE_INITIALIZED) state.initialized = value
    else state.dirty = value
  }

  _markDirty(phase: RenderPhase) {
    // Mark this and all subsequent phases as dirty, including any public view.
    const phaseIndex = renderPhaseIndexMap.get(phase)!
    for (let i = phaseIndex; i < orderedRenderPhases.length; i++) {
      this._setRenderPhaseFlag(i, PHASE_DIRTY, true)
    }

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
    const phaseIndex = renderPhaseIndexMap.get(phase)!
    const phaseState = this._renderPhaseStates?.[phase]
    const isInitialized = phaseState
      ? phaseState.initialized
      : (this._renderPhaseFlags[phaseIndex] & PHASE_INITIALIZED) !== 0
    const isDirty = phaseState
      ? phaseState.dirty
      : (this._renderPhaseFlags[phaseIndex] & PHASE_DIRTY) !== 0

    // Skip if component is being removed and not initialized
    if (!isInitialized && this.shouldBeRemoved) return

    if (this.shouldBeRemoved && isInitialized) {
      this._emitRenderLifecycleEvent(phase, "start")
      ;(this as any)?.[`remove${phase}`]?.()
      this._setRenderPhaseFlag(phaseIndex, PHASE_INITIALIZED, false, phaseState)
      this._setRenderPhaseFlag(phaseIndex, PHASE_DIRTY, false, phaseState)
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }

    // Check for incomplete async effects from previous phases
    const prevPhaseIndex = phaseIndex - 1
    if (this._asyncEffects.length > 0 && prevPhaseIndex >= 0) {
      const prevPhase = orderedRenderPhases[prevPhaseIndex]
      const hasIncompleteEffects = this._asyncEffects.some(
        (e) => e.phase === prevPhase && !e.complete,
      )
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
        this._setRenderPhaseFlag(phaseIndex, PHASE_DIRTY, false, phaseState)
      }
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }
    // Initial render
    this._setRenderPhaseFlag(phaseIndex, PHASE_DIRTY, false, phaseState)
    ;(this as any)?.[`doInitial${phase}`]?.()
    this._setRenderPhaseFlag(phaseIndex, PHASE_INITIALIZED, true, phaseState)
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
        phase === "RenderIsolatedSubcircuits" &&
        "_isIsolatedSubcircuit" in this &&
        this._isIsolatedSubcircuit &&
        "doInitialRenderIsolatedSubcircuits" in this
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
