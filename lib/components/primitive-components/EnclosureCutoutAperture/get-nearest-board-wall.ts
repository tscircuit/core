import type { PcbBoard } from "circuit-json"

export type BoardWall = "left" | "right" | "front" | "back"

export const getNearestBoardWall = ({
  point,
  board,
}: {
  point: { x: number; y: number }
  board: PcbBoard
}): BoardWall => {
  const halfWidth = (board.width ?? 0) / 2
  const halfHeight = (board.height ?? 0) / 2
  const distances: Array<[BoardWall, number]> = [
    ["left", Math.abs(point.x - (board.center.x - halfWidth))],
    ["right", Math.abs(point.x - (board.center.x + halfWidth))],
    ["front", Math.abs(point.y - (board.center.y - halfHeight))],
    ["back", Math.abs(point.y - (board.center.y + halfHeight))],
  ]
  distances.sort((a, b) => a[1] - b[1])
  return distances[0][0]
}
