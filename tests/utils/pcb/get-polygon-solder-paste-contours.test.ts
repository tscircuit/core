import { expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import { getPolygonSolderPasteContours } from "lib/utils/pcb/get-polygon-solder-paste-contours"

test("polygon paste offsets preserve edge distances, split apertures and openings", () => {
  const rectangle = [
    [0, 0],
    [3, 0],
    [3, 2],
    [0, 2],
  ]
  const concave = [
    [0, 0],
    [3, 0],
    [3, 1],
    [1, 1],
    [1, 3],
    [0, 3],
  ]
  const bridge = [
    [0, 0],
    [2, 0],
    [2, 0.8],
    [4, 0.8],
    [4, 0],
    [6, 0],
    [6, 2],
    [4, 2],
    [4, 1.2],
    [2, 1.2],
    [2, 2],
    [0, 2],
  ]
  const opening = [
    [0, 0],
    [6, 0],
    [6, 2.8],
    [5, 2.8],
    [5, 1],
    [1, 1],
    [1, 5],
    [5, 5],
    [5, 3.2],
    [6, 3.2],
    [6, 6],
    [0, 6],
  ]
  const cases = [
    { vertices: rectangle, margin: -0.2, area: 4.16, islands: 1, holes: 0 },
    { vertices: rectangle, margin: 0.2, area: 8.16, islands: 1, holes: 0 },
    {
      vertices: rectangle.toReversed(),
      margin: -0.2,
      area: 4.16,
      islands: 1,
      holes: 0,
    },
    {
      vertices: [...rectangle, rectangle[0]!],
      margin: -0.2,
      area: 4.16,
      islands: 1,
      holes: 0,
    },
    {
      vertices: concave,
      margin: undefined,
      area: 2.0075,
      islands: 1,
      holes: 0,
    },
    { vertices: concave, margin: -0.2, area: 2.76, islands: 1, holes: 0 },
    { vertices: bridge, margin: -0.3, area: 3.92, islands: 2, holes: 0 },
    { vertices: opening, margin: 0.3, area: 32, islands: 1, holes: 1 },
    { vertices: rectangle, margin: -3, area: 0, islands: 0, holes: 0 },
  ]
  for (const { vertices, margin, area, islands, holes } of cases) {
    const points = vertices.map(([x, y]) => ({ x: x!, y: y! }))
    const contours = getPolygonSolderPasteContours({
      points,
      solderPasteMargin: margin,
    })
    expect(contours).toHaveLength(islands)
    expect(contours.flatMap((contour) => contour.holes ?? [])).toHaveLength(
      holes,
    )
    let pasteArea = 0
    for (const contour of contours) {
      const polygon = new Flatten.Polygon([
        contour.points.map(({ x, y }) => new Flatten.Point(x, y)),
        ...(contour.holes ?? []).map((hole) =>
          hole.map(({ x, y }) => new Flatten.Point(x, y)),
        ),
      ])
      expect(polygon.isValid()).toBe(true)
      pasteArea += polygon.area()
      if (margin === undefined || margin < 0) {
        const copper = new Flatten.Polygon(
          points.map(({ x, y }) => new Flatten.Point(x, y)),
        )
        if (copper.orientation() === Flatten.ORIENTATION.CW) copper.reverse()
        expect(
          Flatten.BooleanOperations.subtract(polygon, copper).isEmpty(),
        ).toBe(true)
      }
    }
    expect(pasteArea).toBeCloseTo(area, 6)
  }
})
