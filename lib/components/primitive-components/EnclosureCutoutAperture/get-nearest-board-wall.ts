import type { PcbBoard } from "circuit-json"

/**
 * A side edge of the board, named by the axis its outward normal points along.
 * These are the four vertical members of `EnclosureFace`, so a board wall is
 * already an enclosure face and needs no conversion.
 */
export type BoardWall = "x_pos" | "x_neg" | "y_pos" | "y_neg"

/**
 * The board edge nearest a point. This is only a fallback for footprints that
 * declare no insertion direction; when one is declared it is authoritative,
 * because it already accounts for the part's rotation and mounting layer.
 */
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
    ["x_neg", Math.abs(point.x - (board.center.x - halfWidth))],
    ["x_pos", Math.abs(point.x - (board.center.x + halfWidth))],
    ["y_neg", Math.abs(point.y - (board.center.y - halfHeight))],
    ["y_pos", Math.abs(point.y - (board.center.y + halfHeight))],
  ]
  distances.sort((a, b) => a[1] - b[1])
  return distances[0][0]
}
