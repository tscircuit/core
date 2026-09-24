import { getTaperedWireGeometry } from "./tapered-wire-geometry"
import { getRoutePointPosition } from "./pcb-trace-route-point-utils"
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
    .flatMap((routePoint, index) => {
      const next = mergedRoute[index + 1]
      if (
        routePoint.route_type === "wire" &&
        routePoint.width_interpolation_mode &&
        next
      ) {
        return getTaperedWireGeometry(routePoint, getRoutePointPosition(next))
          .outline
      }
      return getRoutePointPositions(routePoint)
    })
    .every((routePointPosition) =>
      boardOutlinePolygon.contains(
        point(routePointPosition.x, routePointPosition.y),
      ),
    )
}
