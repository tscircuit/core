export const orderedRenderPhases = [
  "SourceRender",
  "DiscoverPorts",
  "PortMatching",
  "SchematicComponentRender",
  "LayoutSchematic",
  "SchematicTraceRender",
  "PcbComponentRender",
  "PcbTraceRender",
  "CadModelRender",
  "PcbAnalysis",
] as const

export type RenderPhase = (typeof orderedRenderPhases)[number]

export type RenderPhaseStates = Record<RenderPhase, { initialized: boolean }>

export type RenderPhaseFunctions = {
  [K in RenderPhase as
    | `doInitial${K}`
    | `update${K}`
    | `remove${K}`]: () => void
}

export type IRenderable = RenderPhaseFunctions & {
  renderPhaseStates: RenderPhaseStates
  runRenderPhase(phase: RenderPhase): void
  runRenderPhaseForChildren(phase: RenderPhase): void
  shouldBeRemoved: boolean
  children: IRenderable[]
  render(): void
}

export abstract class Renderable implements IRenderable {
  renderPhaseStates: RenderPhaseStates
  shouldBeRemoved = false
  children: IRenderable[]

  constructor() {
    this.children = []
    this.renderPhaseStates = {
      DiscoverPorts: { initialized: false },
      SourceRender: { initialized: false },
      PortMatching: { initialized: false },
      SchematicComponentRender: { initialized: false },
      LayoutSchematic: { initialized: false },
      SchematicTraceRender: { initialized: false },
      PcbComponentRender: { initialized: false },
      PcbTraceRender: { initialized: false },
      CadModelRender: { initialized: false },
      PcbAnalysis: { initialized: false },
    }
  }

  render() {
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
    const isInitialized = this.renderPhaseStates[phase].initialized
    if (!isInitialized && this.shouldBeRemoved) return
    if (this.shouldBeRemoved && isInitialized) {
      ;(this as any)[`remove${phase}`]?.()
      this.renderPhaseStates[phase].initialized = false
      return
    }
    if (isInitialized) {
      ;(this as any)[`update${phase}`]?.()
      this.renderPhaseStates[phase].initialized = true
      return
    }
    ;(this as any)[`doInitial${phase}`]?.()
  }

  runRenderPhaseForChildren(phase: RenderPhase): void {
    for (const child of this.children) child.runRenderPhase(phase)
  }

  // METHODS TO OVERRIDE
  doInitialSourceRender() {}
  updateSourceRender() {}
  removeSourceRender() {}
  doInitialDiscoverPorts() {}
  updateDiscoverPorts() {}
  removeDiscoverPorts() {}
  doInitialPortMatching() {}
  updatePortMatching() {}
  removePortMatching() {}
  doInitialSchematicComponentRender() {}
  updateSchematicComponentRender() {}
  removeSchematicComponentRender() {}
  doInitialLayoutSchematic() {}
  updateLayoutSchematic() {}
  removeLayoutSchematic() {}
  doInitialSchematicTraceRender() {}
  updateSchematicTraceRender() {}
  removeSchematicTraceRender() {}
  doInitialPcbComponentRender() {}
  updatePcbComponentRender() {}
  removePcbComponentRender() {}
  doInitialPcbTraceRender() {}
  updatePcbTraceRender() {}
  removePcbTraceRender() {}
  doInitialCadModelRender() {}
  updateCadModelRender() {}
  removeCadModelRender() {}
  doInitialPcbAnalysis() {}
  updatePcbAnalysis() {}
  removePcbAnalysis() {}
}
