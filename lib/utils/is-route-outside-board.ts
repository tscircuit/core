import { point } from "@flatten-js/core"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getPcbBoardOutlinePolygon } from "./get-pcb-board-outline-polygon"
import { getRoutePointPositions } from "./pcb-trace-route-point-utils"

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

  // Check if any route point is outside the board
  return !mergedRoute
    .flatMap(getRoutePointPositions)
    .every((routePointPosition) =>
      boardOutlinePolygon.contains(
        point(routePointPosition.x, routePointPosition.y),
      ),
    )
}
