import { expect, test } from "bun:test"
import { fillCircleWithRects } from "lib/utils/obstacles/fillCircleWithRects"

test("small circles retain a centered obstacle without enlarging the sampling band", () => {
  for (const radius of [0.05, 0.1, 0.15, 0.2]) {
    const rects = fillCircleWithRects(
      { center: { x: 1, y: -2 }, radius },
      { rectHeight: 0.6 },
    )
    expect(rects).toHaveLength(1)
    expect(rects[0].center.x).toBeCloseTo(1)
    expect(rects[0].center.y).toBeCloseTo(-2)
    expect(rects[0].width).toBeCloseTo(radius * 2)
    expect(rects[0].height).toBeCloseTo(radius * 2)
  }

  const ordinaryCircle = fillCircleWithRects(
    { center: { x: 0, y: 0 }, radius: 1 },
    { rectHeight: 0.5 },
  )
  expect(ordinaryCircle.map((rect) => rect.center.y)).toEqual([
    -0.75, -0.25, 0.25, 0.75,
  ])
  expect(ordinaryCircle.map((rect) => rect.height)).toEqual([
    0.5, 0.5, 0.5, 0.5,
  ])
  expect(fillCircleWithRects({ center: { x: 0, y: 0 }, radius: 0 })).toEqual([])
})
