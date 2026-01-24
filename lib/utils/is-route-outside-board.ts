import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"

export const isRouteOutsideBoard = ({
  mergedRoute,
  circuitJson,
  pcbBoardId,
}: {
  mergedRoute: PcbTraceRoutePoint[]
  circuitJson: CircuitJsonUtilObjects
  pcbBoardId: string
}) => {
  let pcbBoard = circuitJson.pcb_board.get(pcbBoardId)

  if (!pcbBoard) return false

  // Function to check if a point is inside a polygon (Ray-casting algorithm)
  const isInsidePolygon = (
    point: PcbTraceRoutePoint,
    polygon: { x: number; y: number }[],
  ) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }
    return inside
  }

  // Check if trace is fully inside the board
  if (pcbBoard.outline && pcbBoard.outline.length > 0) {
    // All points must be inside the outline
    return !mergedRoute.every((point) =>
      isInsidePolygon(point, pcbBoard.outline!),
    )
  }

  // Rectangular check
  const boardWidth = pcbBoard.width
  const boardHeight = pcbBoard.height
  const boardCenterX = pcbBoard.center.x
  const boardCenterY = pcbBoard.center.y

  // All points must be inside the rect
  return !mergedRoute.every((point) => {
    return (
      point.x >= boardCenterX - boardWidth! / 2 &&
      point.y >= boardCenterY - boardHeight! / 2 &&
      point.x <= boardCenterX + boardWidth! / 2 &&
      point.y <= boardCenterY + boardHeight! / 2
    )
  })
}
