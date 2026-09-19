import { expect, test } from "bun:test"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"

test("caps scanline height for thin polygons while preserving ordinary bands", () => {
  for (const height of [0.2, 0.3, 0.4]) {
    const rects = fillPolygonWithRects(
      [
        { x: -1, y: -2 },
        { x: 1, y: -2 },
        { x: 1, y: -2 + height },
        { x: -1, y: -2 + height },
      ],
      { rectHeight: 0.6 },
    )
    expect(rects).toHaveLength(1)
    expect(rects[0].height).toBeCloseTo(height)
    expect(rects[0].center.y).toBeCloseTo(-2 + height / 2)
    expect(rects[0].width).toBeCloseTo(2)
  }

  const triangle = fillPolygonWithRects([
    { x: -2, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 0.04 },
  ])
  expect(triangle).toEqual([
    { center: { x: 0, y: 0.02 }, width: 2, height: 0.04 },
  ])

  expect(
    fillPolygonWithRects(
      [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1.2 },
        { x: 0, y: 1.2 },
      ],
      { rectHeight: 0.6 },
    ).map((rect) => rect.height),
  ).toEqual([0.6, 0.6])
  expect(fillPolygonWithRects([])).toEqual([])
  expect(
    fillPolygonWithRects([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]),
  ).toEqual([])
})
