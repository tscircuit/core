import type { PCBPlacementError, PCBTraceError } from "circuit-json"
import { Component, createElement, type ReactElement } from "react"

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
  "SchematicComponentRender",
  "SchematicLayout",
  "SchematicPortRender",
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
] as const

export type RenderPhase = (typeof orderedRenderPhases)[number]

export type RenderPhaseFn<K extends RenderPhase = RenderPhase> =
  | `doInitial${K}`
  | `update${K}`
  | `remove${K}`

export type RenderPhaseStates = Record<RenderPhase, { initialized: boolean }>

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

  constructor(props: any) {
    this._renderId = `${globalRenderCounter++}`
    this.children = []
    this.renderPhaseStates = {} as RenderPhaseStates
    for (const phase of orderedRenderPhases) {
      this.renderPhaseStates[phase] = { initialized: false }
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
      ;(this as any)?.[`remove${phase}`]?.()
      this.renderPhaseStates[phase].initialized = false
      return
    }
    if (isInitialized) {
      ;(this as any)?.[`update${phase}`]?.()
      return
    }
    ;(this as any)?.[`doInitial${phase}`]?.()
    this.renderPhaseStates[phase].initialized = true
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
      | Omit<PCBTraceError, "pcb_error_id">
      | Omit<PCBPlacementError, "pcb_error_id">,
  ) {
    // TODO add to render phase error list and try to add position or
    // relationships etc.
    if (typeof message === "string") {
      throw new Error(message)
    }
    throw new Error(JSON.stringify(message, null, 2))
  }
}
