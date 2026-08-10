import type {
  AnyCircuitElement,
  PcbBoard,
  PcbComponentOutsideBoardError,
} from "circuit-json"
import { getPcbBoardOutlinePolygon } from "../get-pcb-board-outline-polygon"
import { getPcbComponentOutOfBoardOverhangDistance } from "./get-pcb-component-out-of-board-overhang-distance"

/**
 * Board-edge overhang at or below this many millimeters is placement and
 * rounding noise, not a real design mistake. An overhang this small must not
 * become a render-blocking diagnostic or skip autorouting.
 */
export const OUT_OF_BOARD_TOLERANCE_MM = 0.2

/**
 * Drop "component outside board" errors whose overhang is within tolerance.
 */
export const filterSubToleranceOutOfBoardErrors = <T extends { type: string }>(
  placementCheckResults: T[],
  circuitJson: AnyCircuitElement[],
): T[] => {
  const board = circuitJson.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  if (!board) return placementCheckResults

  const boardOutlinePolygon = getPcbBoardOutlinePolygon(board)

  return placementCheckResults.filter((result) => {
    if (result.type !== "pcb_component_outside_board_error") return true
    const overhang = getPcbComponentOutOfBoardOverhangDistance({
      componentBounds: (result as unknown as PcbComponentOutsideBoardError)
        .component_bounds,
      boardOutlinePolygon,
    })
    return overhang > OUT_OF_BOARD_TOLERANCE_MM
  })
}
