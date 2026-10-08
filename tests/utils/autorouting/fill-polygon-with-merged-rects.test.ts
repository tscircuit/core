import { expect, test } from "bun:test"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"

test("adjacent equal polygon scanlines become one obstacle", () => {
  const rects = fillPolygonWithRects(
    [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
    ],
    { rectHeight: 1 },
  )

  expect(rects).toEqual([
    { center: { x: 1, y: 1 }, width: 2, height: 2 },
    { center: { x: 0.5, y: 3 }, width: 1, height: 2 },
  ])
})
