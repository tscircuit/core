import { point, segment } from "@flatten-js/core"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getPcbBoardOutlinePolygon } from "./get-pcb-board-outline-polygon"
import { getRoutePointPositions } from "./pcb-trace-route-point-utils"

/**
 * Check the route centerline in board-world XY coordinates (millimeters,
 * +X right, +Y up, +Z above; right-handed). Route positions are points.
 * Boundary contact is allowed, matching the existing point-containment rule.
 */
export const isRouteOutsideBoard = ({
  mergedRoute,
  db,
  pcbBoardId,
}: {
  mergedRoute: PcbTraceRoutePoint[]
  db: CircuitJsonUtilObjects
  pcbBoardId: string
}): boolean => {
  const pcbBoard = db.pcb_board.get(pcbBoardId)

  if (!pcbBoard) return false

  const boardOutlinePolygon = getPcbBoardOutlinePolygon(pcbBoard)

  const routePositions = mergedRoute
    .flatMap(getRoutePointPositions)
    .map(({ x, y }) => point(x, y))

  // Inside endpoints alone do not contain a segment on a concave board.
  return !routePositions.every((routePosition, index) => {
    if (!boardOutlinePolygon.contains(routePosition)) return false
    if (index === 0 || routePosition.equalTo(routePositions[index - 1])) {
      return true
    }
    return boardOutlinePolygon.contains(
      segment(routePositions[index - 1], routePosition),
    )
  })
}
