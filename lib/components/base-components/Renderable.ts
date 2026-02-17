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
  "InitializePortsFromChildren",
  "CreateNetsFromProps",
  "AssignFallbackProps",
  "CreateTracesFromProps",
  "CreateTracesFromNetLabels",
  "CreateTraceHintsFromProps",
  "SourceGroupRender",
  "AssignNameToUnnamedComponents",
  "SourceRender",
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
  "SchematicTraceRender",
  "SchematicReplaceNetLabelsWithSymbols",
  "PanelBoardLayout",
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
  "PcbTraceHintRender",
  "PcbManualTraceRender",
  "PcbTraceRender",
  "PcbRouteNetIslands",
  "PcbCopperPourRender",
  "PcbDesignRuleChecks",
  "SilkscreenOverlapAdjustment",
  "CadModelRender",
  "PartsEngineRender",
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
  PcbFootprintLayout: ["PcbFootprintStringRender"],
  PcbComponentSizeCalculation: ["PcbFootprintStringRender"],
  PcbLayout: ["PcbFootprintStringRender"],
  PcbBoardAutoSize: ["PcbFootprintStringRender"],
  PcbTraceHintRender: ["PcbFootprintStringRender"],
  PcbManualTraceRender: ["PcbFootprintStringRender"],
  PcbCopperPourRender: [
    "PcbFootprintStringRender",
    "PcbTraceRender",
    "PcbRouteNetIslands",
  ],
  PcbTraceRender: ["PcbFootprintStringRender"],
  PcbRouteNetIslands: ["PcbFootprintStringRender"],
  PcbDesignRuleChecks: ["PcbFootprintStringRender"],
  SilkscreenOverlapAdjustment: ["PcbFootprintStringRender"],
  CadModelRender: ["PcbFootprintStringRender"],
  PartsEngineRender: ["PcbFootprintStringRender"],
  PcbComponentAnchorAlignment: ["PcbFootprintStringRender"],
  PcbCalcPlacementResolution: ["PcbFootprintStringRender"],
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

let globalRenderCounter = 0
let globalAsyncEffectCounter = 0
export abstract class Renderable implements IRenderable {
  renderPhaseStates: RenderPhaseStates
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
    this.renderPhaseStates = {} as RenderPhaseStates
    for (const phase of orderedRenderPhases) {
      this.renderPhaseStates[phase] = {
        initialized: false,
        dirty: false,
      }
    }
  }

  _markDirty(phase: RenderPhase) {
    this.renderPhaseStates[phase].dirty = true
    // Mark all subsequent phases as dirty
    const phaseIndex = renderPhaseIndexMap.get(phase)!
    for (let i = phaseIndex + 1; i < orderedRenderPhases.length; i++) {
      this.renderPhaseStates[orderedRenderPhases[i]].dirty = true
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
    const phaseState = this.renderPhaseStates[phase]
    const isInitialized = phaseState.initialized
    const isDirty = phaseState.dirty

    // Skip if component is being removed and not initialized
    if (!isInitialized && this.shouldBeRemoved) return

    if (this.shouldBeRemoved && isInitialized) {
      this._emitRenderLifecycleEvent(phase, "start")
      ;(this as any)?.[`remove${phase}`]?.()
      phaseState.initialized = false
      phaseState.dirty = false
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }

    // Check for incomplete async effects from previous phases
    const prevPhaseIndex = renderPhaseIndexMap.get(phase)! - 1
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
        phaseState.dirty = false
      }
      this._emitRenderLifecycleEvent(phase, "end")
      return
    }
    // Initial render
    phaseState.dirty = false
    ;(this as any)?.[`doInitial${phase}`]?.()
    phaseState.initialized = true
    this._emitRenderLifecycleEvent(phase, "end")
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    for (const child of this.children) {
      // For isolated subcircuits, skip children during RenderIsolatedSubcircuits.
      // The children will be rendered in isolation and then inflated back.
      // After inflation, the new children should run all subsequent phases.
      if (
        "_isIsolatedSubcircuit" in this &&
        this._isIsolatedSubcircuit &&
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
