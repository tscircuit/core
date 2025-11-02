import Flatten from "@flatten-js/core"
import type { PcbBoard } from "circuit-json"

export const getBoardPolygon = (board: PcbBoard): Flatten.Polygon => {
  if (board.outline && board.outline.length > 0) {
    return new Flatten.Polygon(
      board.outline.map((p) => Flatten.point(p.x, p.y)),
    )
  }
  return new Flatten.Polygon(
    new Flatten.Box(
      board.center.x - board.width / 2,
      board.center.y - board.height / 2,
      board.center.x + board.width / 2,
      board.center.y + board.height / 2,
    ).toPoints(),
  )
}
