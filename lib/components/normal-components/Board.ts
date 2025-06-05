import { boardProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"
import {
  checkEachPcbTraceNonOverlapping,
  checkSameNetViaSpacing,
} from "@tscircuit/checks"
import type { RenderPhase } from "../base-components/Renderable"

export class Board extends Group<typeof boardProps> {
  pcb_board_id: string | null = null
  _drcChecksComplete = false
  _connectedSchematicPortPairs = new Set<string>()

  get isSubcircuit() {
    return true
  }

  get isGroup() {
    return true
  }

  get config() {
    return {
      componentName: "Board",
      zodProps: boardProps,
    }
  }

  get boardThickness() {
    const { _parsedProps: props } = this
    return 1.4 // TODO use prop
  }

  /**
   * Get all available layers for the board
   */
  get allLayers() {
    // TODO use the board numLayers prop
    return ["top", "bottom", "inner1", "inner2"]
  }

  doInitialPcbBoardAutoSize(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_board_id) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // Skip if width and height are explicitly provided
    if (props.width && props.height) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    // Get all PCB components from the database
    const allPcbComponents = db.pcb_component.list()
    let hasComponents = false

    // Process all PCB components
    for (const pcbComponent of allPcbComponents) {
      const { width, height, center } = pcbComponent

      // Skip components with zero dimensions
      if (width === 0 || height === 0) continue

      // Track that we found at least one valid component
      hasComponents = true

      // Update bounds
      minX = Math.min(minX, center.x - width / 2)
      minY = Math.min(minY, center.y - height / 2)
      maxX = Math.max(maxX, center.x + width / 2)
      maxY = Math.max(maxY, center.y + height / 2)
    }

    // Add padding around components
    const padding = 2

    // Use dimensions of 0,0 when no components are found
    const computedWidth = hasComponents ? maxX - minX + padding * 2 : 0
    const computedHeight = hasComponents ? maxY - minY + padding * 2 : 0

    // Center the board around the components or use (0,0) for empty boards
    const center = {
      x: hasComponents
        ? (minX + maxX) / 2 + (props.outlineOffsetX ?? 0)
        : (props.outlineOffsetX ?? 0),
      y: hasComponents
        ? (minY + maxY) / 2 + (props.outlineOffsetY ?? 0)
        : (props.outlineOffsetY ?? 0),
    }

    // Update the board dimensions
    db.pcb_board.update(this.pcb_board_id, {
      width: computedWidth,
      height: computedHeight,
      center,
    })
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // Initialize with minimal dimensions if not provided
    // They will be updated in PcbBoardAutoSize phase
    let computedWidth = props.width ?? 0
    let computedHeight = props.height ?? 0

    // Compute width and height from outline if not provided
    if (props.outline) {
      const xValues = props.outline.map((point) => point.x)
      const yValues = props.outline.map((point) => point.y)

      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const minY = Math.min(...yValues)
      const maxY = Math.max(...yValues)

      computedWidth = maxX - minX
      computedHeight = maxY - minY
    }

    const pcb_board = db.pcb_board.insert({
      center: {
        x: (props.pcbX ?? 0) + (props.outlineOffsetX ?? 0),
        y: (props.pcbY ?? 0) + (props.outlineOffsetY ?? 0),
      },

      thickness: this.boardThickness,
      num_layers: this.allLayers.length,

      width: computedWidth!,
      height: computedHeight!,
      outline: props.outline?.map((point) => ({
        x: point.x + (props.outlineOffsetX ?? 0),
        y: point.y + (props.outlineOffsetY ?? 0),
      })),
      material: props.material,
    })

    this.pcb_board_id = pcb_board.pcb_board_id!
  }

  removePcbComponentRender(): void {
    const { db } = this.root!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }

  _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }

  doInitialPcbDesignRuleChecks() {
    if (this.root?.pcbDisabled) return
    if (this.getInheritedProperty("routingDisabled")) return

    super.doInitialPcbDesignRuleChecks()
  }

  updatePcbDesignRuleChecks() {
    if (this.root?.pcbDisabled) return
    if (this.getInheritedProperty("routingDisabled")) return
    const { db } = this.root!

    if (!this._areChildSubcircuitsRouted()) return

    // Only run once after all autorouting is complete
    if (this._drcChecksComplete) return
    this._drcChecksComplete = true

    const traceErrors = checkEachPcbTraceNonOverlapping(db.toArray())
    for (const error of traceErrors) {
      db.pcb_trace_error.insert(error)
    }

    const placementErrors = checkSameNetViaSpacing(db.toArray())
    for (const error of placementErrors) {
      db.pcb_placement_error.insert(error)
    }
  }

  override _emitRenderLifecycleEvent(
    phase: RenderPhase,
    startOrEnd: "start" | "end",
  ) {
    super._emitRenderLifecycleEvent(phase, startOrEnd)
    if (startOrEnd === "start") {
      this.root?.emit("board:renderPhaseStarted", {
        renderId: this._renderId,
        phase,
      })
    }
  }
}
