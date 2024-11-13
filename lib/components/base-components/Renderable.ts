import type { PcbPlacementError, PcbTraceError } from "circuit-json"

export const orderedRenderPhases = [
  "ReactSubtreesRender",
  "InitializePortsFromChildren",
  "CreateNetsFromProps",
  "CreateTracesFromProps",
  "CreateTraceHintsFromProps",
  "SourceRender",
  "SourceParentAttachment",
  "PortDiscovery",
  "PortMatching",
  "SourceTraceRender",
  "SourceAddConnectivityMapKey",
  "SchematicComponentRender",
  "SchematicPortRender",
  "SchematicLayout",
  "SchematicTraceRender",
  "PcbComponentRender",
  "PcbPrimitiveRender",
  "PcbFootprintLayout",
  "PcbPortRender",
  "PcbPortAttachment",
  "PcbLayout",
  "PcbTraceRender",
  "PcbTraceHintRender",
  "PcbRouteNetIslands",
  "PcbComponentSizeCalculation",
  "CadModelRender",
  "PartsEngineRender",
] as const

export type RenderPhase = (typeof orderedRenderPhases)[number]

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

  protected _markDirty(phase: RenderPhase) {
    this.renderPhaseStates[phase].dirty = true
    // Mark all subsequent phases as dirty
    const phaseIndex = orderedRenderPhases.indexOf(phase)
    for (let i = phaseIndex + 1; i < orderedRenderPhases.length; i++) {
      this.renderPhaseStates[orderedRenderPhases[i]].dirty = true
    }
  }

  protected _queueAsyncEffect(effect: () => Promise<void>) {
    const asyncEffect: AsyncEffect = {
      promise: effect(), // TODO don't start effects until end of render cycle
      phase: this._currentRenderPhase!,
      complete: false,
    }
    this._asyncEffects.push(asyncEffect)

    // Set up completion handler
    asyncEffect.promise
      .then(() => {
        asyncEffect.complete = true
        // HACK: emit to the root circuit component that an async effect has completed
        if ("root" in this && this.root) {
          ;(this.root as any).emit("asyncEffectComplete", {
            component: this,
            asyncEffect,
          })
        }
      })
      .catch((error) => {
        console.error(
          `Async effect error in ${this._currentRenderPhase}:`,
          error,
        )
        asyncEffect.complete = true

        // HACK: emit to the root circuit component that an async effect has completed
        if ("root" in this && this.root) {
          ;(this.root as any).emit("asyncEffectComplete", {
            component: this,
            asyncEffect,
          })
        }
      })
  }

  _hasIncompleteAsyncEffects(): boolean {
    return this._asyncEffects.some((effect) => !effect.complete)
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

    // Handle removal
    if (this.shouldBeRemoved && isInitialized) {
      ;(this as any)?.[`remove${phase}`]?.()
      phaseState.initialized = false
      phaseState.dirty = false
      return
    }

    // Check for incomplete async effects from previous phases
    const prevPhaseIndex = orderedRenderPhases.indexOf(phase) - 1
    if (prevPhaseIndex >= 0) {
      const prevPhase = orderedRenderPhases[prevPhaseIndex]
      const hasIncompleteEffects = this._asyncEffects
        .filter((e) => e.phase === prevPhase)
        .some((e) => !e.complete)
      if (hasIncompleteEffects) return
    }

    // Handle updates
    if (isInitialized) {
      if (isDirty) {
        ;(this as any)?.[`update${phase}`]?.()
        phaseState.dirty = false
      }
      return
    }
    // Initial render
    phaseState.dirty = false
    ;(this as any)?.[`doInitial${phase}`]?.()
    phaseState.initialized = true
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
      | Omit<PcbPlacementError, "pcb_error_id">,
  ) {
    // TODO add to render phase error list and try to add position or
    // relationships etc.
    if (typeof message === "string") {
      throw new Error(message)
    }
    throw new Error(JSON.stringify(message, null, 2))
  }
}
