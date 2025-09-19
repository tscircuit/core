import { boardProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"
import {
  checkEachPcbPortConnectedToPcbTraces,
  checkEachPcbTraceNonOverlapping,
  checkPcbComponentsOutOfBoard,
} from "@tscircuit/checks"
import type { RenderPhase } from "../base-components/Renderable"
import { getDescendantSubcircuitIds } from "../../utils/autorouting/getAncestorSubcircuitIds"

const getRoundedRectOutline = (
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2)
  const segments = Math.max(1, Math.ceil((Math.PI / 2) * r))
  const step = Math.PI / 2 / segments
  const w2 = width / 2
  const h2 = height / 2

  const outline: { x: number; y: number }[] = []

  outline.push({ x: -w2 + r, y: -h2 })
  outline.push({ x: w2 - r, y: -h2 })
  for (let i = 1; i <= segments; i++) {
    const theta = -Math.PI / 2 + i * step
    outline.push({
      x: w2 - r + r * Math.cos(theta),
      y: -h2 + r + r * Math.sin(theta),
    })
  }

  outline.push({ x: w2, y: h2 - r })
  for (let i = 1; i <= segments; i++) {
    const theta = 0 + i * step
    outline.push({
      x: w2 - r + r * Math.cos(theta),
      y: h2 - r + r * Math.sin(theta),
    })
  }

  outline.push({ x: -w2 + r, y: h2 })
  for (let i = 1; i <= segments; i++) {
    const theta = Math.PI / 2 + i * step
    outline.push({
      x: -w2 + r + r * Math.cos(theta),
      y: h2 - r + r * Math.sin(theta),
    })
  }

  outline.push({ x: -w2, y: -h2 + r })
  for (let i = 1; i <= segments; i++) {
    const theta = Math.PI + i * step
    outline.push({
      x: -w2 + r + r * Math.cos(theta),
      y: -h2 + r + r * Math.sin(theta),
    })
  }

  return outline
}

type AnchorPoint = { x: number; y: number }

const computeCenterFromAnchor = (
  anchor: AnchorPoint,
  alignment: string,
  width: number,
  height: number,
): AnchorPoint => {
  const halfWidth = width / 2
  const halfHeight = height / 2

  switch (alignment) {
    case "top_left":
      return { x: anchor.x + halfWidth, y: anchor.y - halfHeight }
    case "top_center":
      return { x: anchor.x, y: anchor.y - halfHeight }
    case "top_right":
      return { x: anchor.x - halfWidth, y: anchor.y - halfHeight }
    case "left_center":
      return { x: anchor.x + halfWidth, y: anchor.y }
    case "right_center":
      return { x: anchor.x - halfWidth, y: anchor.y }
    case "bottom_left":
      return { x: anchor.x + halfWidth, y: anchor.y + halfHeight }
    case "bottom_center":
      return { x: anchor.x, y: anchor.y + halfHeight }
    case "bottom_right":
      return { x: anchor.x - halfWidth, y: anchor.y + halfHeight }
    case "center":
    default:
      return anchor
  }
}

const computeAutoWidthForAlignment = (
  alignment: string,
  anchorX: number,
  paddedMinX: number,
  paddedMaxX: number,
) => {
  switch (alignment) {
    case "top_left":
    case "left_center":
    case "bottom_left":
      return Math.max(paddedMaxX - anchorX, 0)
    case "top_right":
    case "right_center":
    case "bottom_right":
      return Math.max(anchorX - paddedMinX, 0)
    case "top_center":
    case "bottom_center":
    case "center":
    default: {
      const leftSpan = anchorX - paddedMinX
      const rightSpan = paddedMaxX - anchorX
      const span = Math.max(leftSpan, rightSpan, 0)
      return span > 0 ? span * 2 : 0
    }
  }
}

const computeAutoHeightForAlignment = (
  alignment: string,
  anchorY: number,
  paddedMinY: number,
  paddedMaxY: number,
) => {
  switch (alignment) {
    case "top_left":
    case "top_center":
    case "top_right":
      return Math.max(anchorY - paddedMinY, 0)
    case "bottom_left":
    case "bottom_center":
    case "bottom_right":
      return Math.max(paddedMaxY - anchorY, 0)
    case "left_center":
    case "right_center":
    case "center":
    default: {
      const bottomSpan = anchorY - paddedMinY
      const topSpan = paddedMaxY - anchorY
      const span = Math.max(bottomSpan, topSpan, 0)
      return span > 0 ? span * 2 : 0
    }
  }
}

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
    const layerCount = this._parsedProps.layers ?? 2
    if (layerCount === 4) {
      return ["top", "bottom", "inner1", "inner2"] as const
    }
    return ["top", "bottom"] as const
  }

  _getSubcircuitLayerCount(): number {
    return this._parsedProps.layers ?? 2
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

    // Get all PCB components and groups from the database
    const descendantIds = getDescendantSubcircuitIds(db, this.subcircuit_id!)
    const allowedSubcircuitIds = new Set([this.subcircuit_id, ...descendantIds])

    const allPcbComponents = db.pcb_component
      .list()
      .filter(
        (c) => c.subcircuit_id && allowedSubcircuitIds.has(c.subcircuit_id),
      )
    const allPcbGroups = db.pcb_group
      .list()
      .filter(
        (g) => g.subcircuit_id && allowedSubcircuitIds.has(g.subcircuit_id),
      )

    let hasComponents = false

    const updateBounds = (
      center: { x: number; y: number },
      width: number,
      height: number,
    ) => {
      if (width === 0 || height === 0) return
      hasComponents = true
      minX = Math.min(minX, center.x - width / 2)
      minY = Math.min(minY, center.y - height / 2)
      maxX = Math.max(maxX, center.x + width / 2)
      maxY = Math.max(maxY, center.y + height / 2)
    }

    // Process all PCB components
    for (const pcbComponent of allPcbComponents) {
      updateBounds(pcbComponent.center, pcbComponent.width, pcbComponent.height)
    }

    // Process all PCB groups (for nested subcircuits)
    for (const pcbGroup of allPcbGroups) {
      updateBounds(pcbGroup.center, pcbGroup.width, pcbGroup.height)
    }

    const padding = 2
    const outlineOffsetX = props.outlineOffsetX ?? 0
    const outlineOffsetY = props.outlineOffsetY ?? 0
    const anchorAlignment = props.boardAnchorAlignment ?? "center"
    const anchorPosition = props.boardAnchorPosition
      ? {
          x: props.boardAnchorPosition.x + outlineOffsetX,
          y: props.boardAnchorPosition.y + outlineOffsetY,
        }
      : null

    let computedWidth = 0
    let computedHeight = 0

    if (anchorPosition) {
      if (hasComponents) {
        const paddedMinX = minX - padding
        const paddedMaxX = maxX + padding
        const paddedMinY = minY - padding
        const paddedMaxY = maxY + padding

        computedWidth = computeAutoWidthForAlignment(
          anchorAlignment,
          anchorPosition.x,
          paddedMinX,
          paddedMaxX,
        )
        computedHeight = computeAutoHeightForAlignment(
          anchorAlignment,
          anchorPosition.y,
          paddedMinY,
          paddedMaxY,
        )
      }
    } else {
      computedWidth = hasComponents ? maxX - minX + padding * 2 : 0
      computedHeight = hasComponents ? maxY - minY + padding * 2 : 0
    }

    // Update the board dimensions, preserving any explicit dimension provided
    // by the user while auto-calculating the missing one.
    const finalWidth = props.width ?? computedWidth
    const finalHeight = props.height ?? computedHeight

    const center = anchorPosition
      ? computeCenterFromAnchor(
          anchorPosition,
          anchorAlignment,
          finalWidth,
          finalHeight,
        )
      : {
          x: hasComponents
            ? (minX + maxX) / 2 + outlineOffsetX
            : outlineOffsetX,
          y: hasComponents
            ? (minY + maxY) / 2 + outlineOffsetY
            : outlineOffsetY,
        }

    let outline = props.outline
    if (
      !outline &&
      props.borderRadius != null &&
      finalWidth > 0 &&
      finalHeight > 0
    ) {
      outline = getRoundedRectOutline(
        finalWidth,
        finalHeight,
        props.borderRadius,
      )
    }

    const update: Record<string, unknown> = {
      width: finalWidth,
      height: finalHeight,
      center,
    }

    if (outline) {
      update.outline = outline.map((point) => ({
        x: point.x + (props.outlineOffsetX ?? 0),
        y: point.y + (props.outlineOffsetY ?? 0),
      }))
    }

    db.pcb_board.update(this.pcb_board_id, update)
  }

  // Recompute autosize after child components update (e.g., async footprints)
  updatePcbBoardAutoSize(): void {
    // Reuse the same logic as initial autosize; it is idempotent
    this.doInitialPcbBoardAutoSize()
  }

  /**
   * Update the board information silkscreen text if platform config is set and
   * the project name, version, or url is set.
   */
  private _addBoardInformationToSilkscreen() {
    const platform = this.root?.platform
    if (!platform?.printBoardInformationToSilkscreen) return

    const pcbBoard = this.root!.db.pcb_board.get(this.pcb_board_id!)
    if (!pcbBoard) return

    const boardInformation: string[] = []
    if (platform.projectName) boardInformation.push(platform.projectName)
    if (platform.version) boardInformation.push(`v${platform.version}`)
    if (platform.url) boardInformation.push(platform.url)
    if (boardInformation.length === 0) return

    const text = boardInformation.join("\n")
    const marginX = 0.25
    const marginY = 1
    const position = {
      x: pcbBoard.center.x + pcbBoard.width / 2 - marginX,
      y: pcbBoard.center.y - pcbBoard.height / 2 + marginY,
    }

    this.root!.db.pcb_silkscreen_text.insert({
      pcb_component_id: this.pcb_board_id!,
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.45,
      text,
      ccw_rotation: 0,
      anchor_alignment: "bottom_right",
      anchor_position: position,
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
    const outlineOffsetX = props.outlineOffsetX ?? 0
    const outlineOffsetY = props.outlineOffsetY ?? 0
    const anchorAlignment = props.boardAnchorAlignment ?? "center"
    const anchorPosition = props.boardAnchorPosition
      ? {
          x: props.boardAnchorPosition.x + outlineOffsetX,
          y: props.boardAnchorPosition.y + outlineOffsetY,
        }
      : null
    let center = anchorPosition
      ? computeCenterFromAnchor(
          anchorPosition,
          anchorAlignment,
          computedWidth,
          computedHeight,
        )
      : {
          x: (props.pcbX ?? 0) + outlineOffsetX,
          y: (props.pcbY ?? 0) + outlineOffsetY,
        }

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
      center = anchorPosition
        ? computeCenterFromAnchor(
            anchorPosition,
            anchorAlignment,
            computedWidth,
            computedHeight,
          )
        : {
            x: (minX + maxX) / 2 + outlineOffsetX,
            y: (minY + maxY) / 2 + outlineOffsetY,
          }
    }

    let outline = props.outline
    if (
      !outline &&
      props.borderRadius != null &&
      computedWidth > 0 &&
      computedHeight > 0
    ) {
      outline = getRoundedRectOutline(
        computedWidth,
        computedHeight,
        props.borderRadius,
      )
    }

    const pcb_board = db.pcb_board.insert({
      center,

      thickness: this.boardThickness,
      num_layers: this.allLayers.length,

      width: computedWidth!,
      height: computedHeight!,
      outline: outline?.map((point) => ({
        x: point.x + (props.outlineOffsetX ?? 0),
        y: point.y + (props.outlineOffsetY ?? 0),
      })),
      material: props.material,
    })

    this.pcb_board_id = pcb_board.pcb_board_id!

    // Add board information silkscreen text
    this._addBoardInformationToSilkscreen()
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

    const errors = checkEachPcbTraceNonOverlapping(db.toArray())
    for (const error of errors) {
      db.pcb_trace_error.insert(error)
    }

    const pcbPortNotConnectedErrors = checkEachPcbPortConnectedToPcbTraces(
      db.toArray(),
    )
    for (const error of pcbPortNotConnectedErrors) {
      db.pcb_port_not_connected_error.insert(error)
    }

    const pcbComponentOutsideErrors = checkPcbComponentsOutOfBoard(db.toArray())
    for (const error of pcbComponentOutsideErrors) {
      db.pcb_component_outside_board_error.insert(error)
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
