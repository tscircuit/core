import { getBoardCenterFromAnchor } from "../../utils/boards/get-board-center-from-anchor"
import { boardProps } from "@tscircuit/props"
import { Group } from "../primitive-components/Group/Group"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { inflateCircuitJson } from "../../utils/circuit-json/inflate-circuit-json"
import type { SubcircuitI } from "../primitive-components/Group/Subcircuit/SubcircuitI"
import {
  checkEachPcbPortConnectedToPcbTraces,
  checkEachPcbTraceNonOverlapping,
  checkPcbComponentsOutOfBoard,
  checkPcbTracesOutOfBoard,
  checkDifferentNetViaSpacing,
  checkSameNetViaSpacing,
  checkPcbComponentOverlap,
  checkPinMustBeConnected,
} from "@tscircuit/checks"
import { getDescendantSubcircuitIds } from "../../utils/autorouting/getAncestorSubcircuitIds"
import type { RenderPhase } from "../base-components/Renderable"
import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { BoardI } from "./BoardI"
import type { PcbBoard } from "circuit-json"

const MIN_EFFECTIVE_BORDER_RADIUS_MM = 0.01

const getRoundedRectOutline = (
  width: number,
  height: number,
  radius: number,
) => {
  const w2 = width / 2
  const h2 = height / 2
  const r = Math.min(radius, w2, h2)

  if (r < MIN_EFFECTIVE_BORDER_RADIUS_MM) {
    return [
      { x: -w2, y: -h2 },
      { x: w2, y: -h2 },
      { x: w2, y: h2 },
      { x: -w2, y: h2 },
    ]
  }

  const maxArcLengthPerSegment = 0.1 // mm
  const segments = Math.max(
    1,
    Math.ceil(((Math.PI / 2) * r) / maxArcLengthPerSegment),
  )
  const step = Math.PI / 2 / segments

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

export class Board
  extends Group<typeof boardProps>
  implements BoardI, SubcircuitI
{
  pcb_board_id: string | null = null
  source_board_id: string | null = null
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
    return this._parsedProps.thickness ?? 1.4
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

  _getBoardCalcVariables(): Record<string, number> {
    const { _parsedProps: props } = this
    const isAutoSized =
      (props.width == null || props.height == null) && !props.outline
    if (isAutoSized) return {}

    const dbBoard = this.pcb_board_id
      ? this.root?.db.pcb_board.get(this.pcb_board_id)
      : null

    let width = dbBoard?.width ?? props.width
    let height = dbBoard?.height ?? props.height

    if ((width == null || height == null) && props.outline?.length) {
      const outlineBounds = getBoundsFromPoints(props.outline)
      if (outlineBounds) {
        width ??= outlineBounds.maxX - outlineBounds.minX
        height ??= outlineBounds.maxY - outlineBounds.minY
      }
    }

    const { pcbX, pcbY } = this.getResolvedPcbPositionProp()
    const center = dbBoard?.center ?? {
      x: pcbX + (props.outlineOffsetX ?? 0),
      y: pcbY + (props.outlineOffsetY ?? 0),
    }

    const resolvedWidth = width ?? 0
    const resolvedHeight = height ?? 0

    return {
      "board.minx": center.x - resolvedWidth / 2,
      "board.maxx": center.x + resolvedWidth / 2,
      "board.miny": center.y - resolvedHeight / 2,
      "board.maxy": center.y + resolvedHeight / 2,
    }
  }

  doInitialPcbBoardAutoSize(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_board_id) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    // Use global position to properly handle boards inside panels
    const globalPos = this._getGlobalPcbPositionBeforeLayout()

    const pcbBoard = db.pcb_board.get(this.pcb_board_id!)

    // If the board is already sized (from props or circuitJson) or has an outline, don't autosize
    if (
      (pcbBoard?.width && pcbBoard?.height) ||
      (pcbBoard?.outline && pcbBoard.outline.length > 0)
    )
      return

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
      let width = pcbGroup.width ?? 0
      let height = pcbGroup.height ?? 0

      // If the group has an outline, calculate width and height from outline
      if (pcbGroup.outline && pcbGroup.outline.length > 0) {
        const bounds = getBoundsFromPoints(pcbGroup.outline)
        if (bounds) {
          width = bounds.maxX - bounds.minX
          height = bounds.maxY - bounds.minY
        }
      }

      updateBounds(pcbGroup.center, width, height)
    }

    if (props.boardAnchorPosition) {
      const { x, y } = props.boardAnchorPosition
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    // Add padding around components
    const padding = 2

    // Use dimensions of 0,0 when no components are found
    const computedWidth = hasComponents ? maxX - minX + padding * 2 : 0
    const computedHeight = hasComponents ? maxY - minY + padding * 2 : 0

    // Center the board around the components or use global position for empty boards
    const center = {
      x: hasComponents
        ? (minX + maxX) / 2 + (props.outlineOffsetX ?? 0)
        : (props.outlineOffsetX ?? 0) + globalPos.x,
      y: hasComponents
        ? (minY + maxY) / 2 + (props.outlineOffsetY ?? 0)
        : (props.outlineOffsetY ?? 0) + globalPos.y,
    }

    // by the user while auto-calculating the missing one.
    const finalWidth = props.width ?? computedWidth
    const finalHeight = props.height ?? computedHeight

    let outline = props.outline as { x: number; y: number }[] | undefined
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
      x: pcbBoard.center.x + pcbBoard.width! / 2 - marginX,
      y: pcbBoard.center.y - pcbBoard.height! / 2 + marginY,
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

  doInitialSourceRender() {
    // Check for nested boards (boards inside this board at any depth)
    const nestedBoard = this.getDescendants().find(
      (d) => d.lowercaseComponentName === "board",
    )
    if (nestedBoard) {
      throw new Error(
        `Nested boards are not supported: found board "${nestedBoard.name}" inside board "${this.name}"`,
      )
    }

    super.doInitialSourceRender()

    const { db } = this.root!

    const source_board = db.source_board.insert({
      source_group_id: this.source_group_id!,
      title: this.props.title || this.props.name,
    })

    this.source_board_id = source_board.source_board_id
  }

  doInitialInflateSubcircuitCircuitJson() {
    const { circuitJson, children } = this._parsedProps
    inflateCircuitJson(this, circuitJson, children)
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const circuitJsonElements = props.circuitJson
    const pcbBoardFromCircuitJson = circuitJsonElements?.find(
      (elm) => elm.type === "pcb_board",
    )

    // Initialize with minimal dimensions if not provided
    // They will be updated in PcbBoardAutoSize phase
    let computedWidth = props.width ?? pcbBoardFromCircuitJson?.width ?? 0
    let computedHeight = props.height ?? pcbBoardFromCircuitJson?.height ?? 0
    // Use global position to properly handle boards inside panels
    const globalPos = this._getGlobalPcbPositionBeforeLayout()
    let center = {
      x: globalPos.x + (props.outlineOffsetX ?? 0),
      y: globalPos.y + (props.outlineOffsetY ?? 0),
    }

    const { boardAnchorPosition, boardAnchorAlignment } = props

    if (boardAnchorPosition) {
      center = getBoardCenterFromAnchor({
        boardAnchorPosition,
        boardAnchorAlignment: boardAnchorAlignment ?? "center",
        width: computedWidth,
        height: computedHeight,
      })
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
      source_board_id: this.source_board_id,
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
    } as Omit<PcbBoard, "type" | "pcb_board_id">)

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

    const pcbTracesOutOfBoardErrors = checkPcbTracesOutOfBoard(db.toArray())
    for (const error of pcbTracesOutOfBoardErrors) {
      db.pcb_trace_error.insert(error)
    }

    const differentNetViaErrors = checkDifferentNetViaSpacing(db.toArray())
    for (const error of differentNetViaErrors) {
      db.pcb_via_clearance_error.insert(error)
    }

    const sameNetViaErrors = checkSameNetViaSpacing(db.toArray())
    for (const error of sameNetViaErrors) {
      db.pcb_via_clearance_error.insert(error)
    }

    const pcbComponentOverlapErrors = checkPcbComponentOverlap(db.toArray())
    for (const error of pcbComponentOverlapErrors) {
      db.pcb_footprint_overlap_error.insert(error)
    }

    const sourcePinMustBeConnectedErrors = checkPinMustBeConnected(db.toArray())
    for (const error of sourcePinMustBeConnectedErrors) {
      db.source_pin_must_be_connected_error.insert(error)
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

  _repositionOnPcb(position: { x: number; y: number }): void {
    const { db } = this.root!
    const pcbBoard = this.pcb_board_id
      ? db.pcb_board.get(this.pcb_board_id)
      : null
    const oldPos = pcbBoard?.center

    if (!oldPos) {
      if (this.pcb_board_id) {
        db.pcb_board.update(this.pcb_board_id, { center: position })
      }
      return
    }

    const deltaX = position.x - oldPos.x
    const deltaY = position.y - oldPos.y

    if (Math.abs(deltaX) < 1e-6 && Math.abs(deltaY) < 1e-6) {
      return
    }

    for (const child of this.children) {
      if (child instanceof NormalComponent) {
        let childOldCenter: { x: number; y: number } | undefined

        if (child.pcb_component_id) {
          const comp = db.pcb_component.get(child.pcb_component_id)
          if (comp) childOldCenter = comp.center
        } else if (child instanceof Group && child.pcb_group_id) {
          const group = db.pcb_group.get(child.pcb_group_id)
          if (group) childOldCenter = group.center
        }

        if (childOldCenter) {
          child._repositionOnPcb({
            x: childOldCenter.x + deltaX,
            y: childOldCenter.y + deltaY,
          })
        }
      } else if (
        child.isPcbPrimitive &&
        "_repositionOnPcb" in child &&
        typeof child._repositionOnPcb === "function"
      ) {
        child._repositionOnPcb({ deltaX, deltaY })
      }
    }

    if (this.pcb_board_id) {
      db.pcb_board.update(this.pcb_board_id, { center: position })

      if (pcbBoard?.outline) {
        const outlineBounds = getBoundsFromPoints(pcbBoard.outline)
        if (outlineBounds) {
          const oldOutlineCenter = {
            x: (outlineBounds.minX + outlineBounds.maxX) / 2,
            y: (outlineBounds.minY + outlineBounds.maxY) / 2,
          }
          const outlineDeltaX = position.x - oldOutlineCenter.x
          const outlineDeltaY = position.y - oldOutlineCenter.y

          const newOutline = pcbBoard.outline.map((p) => ({
            x: p.x + outlineDeltaX,
            y: p.y + outlineDeltaY,
          }))

          db.pcb_board.update(this.pcb_board_id, {
            outline: newOutline,
          })
        }
      }
    }
  }
}
