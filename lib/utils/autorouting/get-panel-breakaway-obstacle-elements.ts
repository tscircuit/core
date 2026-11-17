import {
  getBoardBounds,
  getPcbElementsWithinBounds,
} from "@tscircuit/circuit-json-util"
import type {
  AnyCircuitElement,
  PcbBoard,
  PcbCutout,
  PcbHole,
} from "circuit-json"

/** Distance (mm) beyond the board edge within which panel geometry blocks routing. */
const PANEL_BREAKAWAY_OBSTACLE_MARGIN = 1

/**
 * Holes and cutouts owned by an enclosing panel (mouse-bite drills, tab
 * routing slots) whose bounds reach the board. They carry the panel's
 * subcircuit ID, so a board's subcircuit-scoped routing input would otherwise
 * omit them. Coordinates are circuit-world mm, +X right, +Y up.
 */
export function getPanelBreakawayObstacleElements({
  board,
  elements,
  boardSubcircuitIds,
}: {
  board: PcbBoard
  elements: AnyCircuitElement[]
  boardSubcircuitIds: Set<string>
}): Array<PcbHole | PcbCutout> {
  const panelGeometry = elements.filter(
    (element): element is PcbHole | PcbCutout =>
      (element.type === "pcb_hole" || element.type === "pcb_cutout") &&
      !boardSubcircuitIds.has(element.subcircuit_id ?? ""),
  )
  const boardBounds = getBoardBounds(board)
  return getPcbElementsWithinBounds(panelGeometry, {
    minX: boardBounds.minX - PANEL_BREAKAWAY_OBSTACLE_MARGIN,
    minY: boardBounds.minY - PANEL_BREAKAWAY_OBSTACLE_MARGIN,
    maxX: boardBounds.maxX + PANEL_BREAKAWAY_OBSTACLE_MARGIN,
    maxY: boardBounds.maxY + PANEL_BREAKAWAY_OBSTACLE_MARGIN,
  }) as Array<PcbHole | PcbCutout>
}
