import { expect, test } from "bun:test"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"

test("a polygon shorter than the default scanline retains its area and bounds", (): void => {
  const rectangles = fillPolygonWithRects([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 0.04 },
    { x: 0, y: 0.04 },
  ])
  expect(rectangles).toHaveLength(1)
  expect(rectangles[0]!.width * rectangles[0]!.height).toBeCloseTo(0.08, 8)
  expect(rectangles[0]!.center.y + rectangles[0]!.height / 2).toBeCloseTo(
    0.04,
    8,
  )
})
