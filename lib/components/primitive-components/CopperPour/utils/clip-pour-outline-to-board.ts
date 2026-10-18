import Flatten from "@flatten-js/core"
import type { Point } from "circuit-json"

const createCcwPolygon = (outline: Point[]) => {
  const polygon = new Flatten.Polygon(
    outline.map(({ x, y }) => new Flatten.Point(x, y)),
  )
  if (polygon.orientation() === Flatten.ORIENTATION.CW) polygon.reverse()
  return polygon
}

/** Board-world points in mm: +X right, +Y up, right-handed +Z above. */
export const clipPourOutlineToBoard = (
  pourOutline: Point[],
  boardOutline: Point[],
): Point[][] => {
  const pourPolygon = createCcwPolygon(pourOutline)
  const boardPolygon = createCcwPolygon(boardOutline)
  if (boardPolygon.contains(pourPolygon)) return [pourOutline]

  return Flatten.BooleanOperations.intersect(pourPolygon, boardPolygon)
    .splitToIslands()
    .map((island) => {
      const outerFace = ([...island.faces] as Flatten.Face[]).find(
        (face) => face.orientation() === Flatten.ORIENTATION.CCW,
      )!
      return outerFace.vertices.map(({ x, y }) => ({ x, y }))
    })
}
