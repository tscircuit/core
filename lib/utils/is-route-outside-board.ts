import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTraceRoutePoint } from "circuit-json"

export const isRouteOutsideBoard = (
  mergedRoute: PcbTraceRoutePoint[],
  { db }: { db: CircuitJsonUtilObjects },
) => {
  const pcbBoard = db.pcb_board.list()[0]

  // Check if the board has an outline
  if (pcbBoard.outline) {
    const boardOutline = pcbBoard.outline

    // Function to check if a point is inside a polygon (Ray-casting algorithm)
    const isInsidePolygon = (
      point: PcbTraceRoutePoint,
      polygon: { x: number; y: number }[],
    ) => {
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x,
          yi = polygon[i].y
        const xj = polygon[j].x,
          yj = polygon[j].y

        const intersect =
          yi > point.y !== yj > point.y &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

        if (intersect) inside = !inside
      }
      return inside
    }

    // Check if any trace point is outside the board outline
    return mergedRoute.some((point) => !isInsidePolygon(point, boardOutline))
  }

  // New error handling for traces routed outside the board
  const boardWidth = pcbBoard.width
  const boardHeight = pcbBoard.height
  
  // If board has no width/height (outline-based board without dimensions), skip check
  if (!boardWidth || !boardHeight) {
    return false
  }
  
  const boardCenterX = pcbBoard.center.x
  const boardCenterY = pcbBoard.center.y

  const outsideBoard = mergedRoute.some((point) => {
    return (
      point.x < boardCenterX - boardWidth / 2 ||
      point.y < boardCenterY - boardHeight / 2 ||
      point.x > boardCenterX + boardWidth / 2 ||
      point.y > boardCenterY + boardHeight / 2
    )
  })
  return outsideBoard
}
