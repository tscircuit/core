import { getBoardBounds } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbBoard, PcbHoleCircle } from "circuit-json"

/** Select panel-owned drills that can affect a board in circuit-world mm
 * (+X right/+Y up, right-handed +Z above). Bounds and drill centers are
 * positions. Include the drill radius and 0.2 mm copper clearance outside
 * the board so an outward-shifted drill still participates in routing / DRC. */
export function getPanelMouseBiteHolesForBoard(
  elements: AnyCircuitElement[],
  board: PcbBoard,
) {
  const bounds = getBoardBounds(board)
  return elements.filter((element): element is PcbHoleCircle => {
    if (
      element.type !== "pcb_hole" ||
      element.hole_shape !== "circle" ||
      !element.pcb_hole_id.startsWith("panel_mouse_bite_")
    )
      return false
    const margin = element.hole_diameter / 2 + 0.2
    return (
      element.x >= bounds.minX - margin &&
      element.x <= bounds.maxX + margin &&
      element.y >= bounds.minY - margin &&
      element.y <= bounds.maxY + margin
    )
  })
}
