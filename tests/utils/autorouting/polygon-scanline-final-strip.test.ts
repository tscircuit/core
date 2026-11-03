import { expect, test } from "bun:test"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"

test("polygon scanlines clip the final rectangle to the polygon height", (): void => {
  const rectangles = fillPolygonWithRects([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1.25 },
    { x: 0, y: 1.25 },
  ], { rectHeight: 0.5 })
  expect(rectangles.map((rectangle) => rectangle.height)).toEqual([0.5, 0.5, 0.25])
  expect(rectangles.reduce(
    (area, rectangle) => area + rectangle.width * rectangle.height, 0,
  )).toBeCloseTo(1.25, 8)
  expect(Math.max(...rectangles.map(
    (rectangle) => rectangle.center.y + rectangle.height / 2,
  ))).toBeCloseTo(1.25, 8)
})
