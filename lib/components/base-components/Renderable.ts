import type {
  PcbManualEditConflictWarning,
  PcbPlacementError,
  PcbTraceError,
  PcbViaClearanceError,
} from "circuit-json"
import Debug from "debug"

const debug = Debug("tscircuit:renderable")

export const orderedRenderPhases = [
  "ReactSubtreesRender",
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
  "SchematicPrimitiveRender",
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

export type AsyncEffectStartEvent = {
  effectName: string
  componentDisplayName: string
  phase: RenderPhase
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
    const asyncEffectId = `${this._renderId}-${globalAsyncEffectCounter++}`
    const asyncEffect: AsyncEffect = {
      asyncEffectId,
      promise: effect(), // TODO don't start effects until end of render cycle
      phase: this._currentRenderPhase!,
      effectName,
      complete: false,
    }
    this._asyncEffects.push(asyncEffect)

    if ("root" in this && this.root) {
      const startEvent: AsyncEffectStartEvent = {
        effectName,
        componentDisplayName: this.getString(),
        phase: asyncEffect.phase,
      }
      ;(this.root as any)._trackAsyncEffectStart?.({
        startEvent,
        component: this,
        asyncEffectId,
      })
      ;(this.root as any).emit("asyncEffect:start", startEvent)
    }

    // Set up completion handler
    asyncEffect.promise
      .then(() => {
        asyncEffect.complete = true
        if ("root" in this && this.root) {
          ;(this.root as any)._trackAsyncEffectEnd?.({
            phase: asyncEffect.phase,
            component: this,
            asyncEffectId,
          })
        }
        // HACK: emit to the root circuit component that an async effect has completed
        if ("root" in this && this.root) {
          ;(this.root as any).emit("asyncEffect:end", {
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
        if ("root" in this && this.root) {
          ;(this.root as any)._trackAsyncEffectEnd?.({
            phase: asyncEffect.phase,
            component: this,
            asyncEffectId,
          })
        }

        // HACK: emit to the root circuit component that an async effect has completed
        if ("root" in this && this.root) {
          ;(this.root as any).emit("asyncEffect:end", {
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
    const granular_event_type = `renderable:renderLifecycle:${phase}:${startOrEnd}`
    const eventPayload = {
      renderId: this._renderId,
      componentDisplayName: this.getString(),
      type: granular_event_type,
    }
    if ("root" in this && this.root) {
      ;(this.root as any).emit(granular_event_type, eventPayload)
      ;(this.root as any).emit("renderable:renderLifecycle:anyEvent", {
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
    if ("root" in this && this.root) {
      return (this.root as any)._hasIncompleteAsyncEffectsForPhase?.(phase)
    }
    return this._asyncEffects.some(
      (effect) => !effect.complete && effect.phase === phase,
    )
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
      const root = this.getTopLevelRenderable()
      for (const depPhase of deps) {
        if (root._hasIncompleteAsyncEffectsInSubtreeForPhase(depPhase)) {
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
      child.runRenderPhaseForChildren(phase)
      child.runRenderPhase(phase)
    }
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
