import { Box, point, Polygon } from "@flatten-js/core"

export const getPcbBoardOutlinePolygon = (pcbBoard: {
  outline?: { x: number; y: number }[]
  center: { x: number; y: number }
  width?: number
  height?: number
}): Polygon => {
  if (pcbBoard.outline && pcbBoard.outline.length > 0) {
    return new Polygon(pcbBoard.outline.map((p) => point(p.x, p.y)))
  }
  return new Polygon(
    new Box(
      pcbBoard.center.x - pcbBoard.width! / 2,
      pcbBoard.center.y - pcbBoard.height! / 2,
      pcbBoard.center.x + pcbBoard.width! / 2,
      pcbBoard.center.y + pcbBoard.height! / 2,
    ).toPoints(),
  )
}
