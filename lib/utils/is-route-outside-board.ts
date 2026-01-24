import { point } from "@flatten-js/core"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getBoardOutlinePolygon } from "./get-board-outline-polygon"

export const isRouteOutsideBoard = ({
  mergedRoute,
  circuitJson,
  pcbBoardId,
}: {
  mergedRoute: PcbTraceRoutePoint[]
  circuitJson: CircuitJsonUtilObjects
  pcbBoardId: string
}): boolean => {
  const pcbBoard = circuitJson.pcb_board.get(pcbBoardId)

  if (!pcbBoard) return false

  const boardPolygon = getBoardOutlinePolygon(pcbBoard)

  // Check if any route point is outside the board
  return !mergedRoute
    .flat()
    .every((routePoint) =>
      boardPolygon.contains(point(routePoint.x, routePoint.y)),
    )
}
