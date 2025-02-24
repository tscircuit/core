import type { SoupUtilObjects } from "@tscircuit/soup-util"
import type { PcbTraceRoutePoint } from "circuit-json"

export const isRouteOutsideBoard = (
  mergedRoute: PcbTraceRoutePoint[],
  { db }: { db: SoupUtilObjects },
) => {
  const pcbBoard = db.pcb_board.list()[0]

  // New error handling for traces routed outside the board
  const boardWidth = pcbBoard.width
  const boardHeight = pcbBoard.height
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
