import { Component, createElement, type ReactElement } from "react"

export const orderedRenderPhases = [
  "ReactSubtreesRender", // probably going to be removed b/c subtrees should render instantly
  "SourceRender",
  "PortDiscovery", // probably going to be removed b/c port discovery can always be done on prop change
  "PortMatching",
  "SchematicComponentRender",
  "SchematicLayout",
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

  constructor(props: any) {
    this._renderId = `${globalRenderCounter++}`
    this.children = []
    this.renderPhaseStates = {
      ReactSubtreesRender: { initialized: false },
      PortDiscovery: { initialized: false },
      SourceRender: { initialized: false },
      PortMatching: { initialized: false },
      SchematicComponentRender: { initialized: false },
      SchematicLayout: { initialized: false },
      SchematicTraceRender: { initialized: false },
      PcbComponentRender: { initialized: false },
      PcbTraceRender: { initialized: false },
      CadModelRender: { initialized: false },
      PcbAnalysis: { initialized: false },
    }
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
  doInitialReactSubtreesRender() {}
  updateReactSubtreesRender() {}
  removeReactSubtreesRender() {}
  doInitialSourceRender() {}
  updateSourceRender() {}
  removeSourceRender() {}
  doInitialPortDiscovery() {}
  updatePortDiscovery() {}
  removePortDiscovery() {}
  doInitialPortMatching() {}
  updatePortMatching() {}
  removePortMatching() {}
  doInitialSchematicComponentRender() {}
  updateSchematicComponentRender() {}
  removeSchematicComponentRender() {}
  doInitialSchematicLayout() {}
  updateSchematicLayout() {}
  removeSchematicLayout() {}
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
