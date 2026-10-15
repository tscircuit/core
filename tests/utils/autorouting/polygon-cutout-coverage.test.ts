import { expect, test } from "bun:test"
import { coverPolygonWithRects } from "lib/utils/obstacles/cover-polygon-with-rects"
import {
  containsPoint,
  getUncoveredPolygonArea,
  renderPolygonCutoutCoverage,
} from "tests/fixtures/polygon-cutout-coverage"

test("polygon covers retain thin slots, slopes, winding and narrow open notches", () => {
  const shapes = [
    [
      [0, 0],
      [2, 0],
      [2, 0.2],
      [0, 0.2],
    ],
    [
      [0, 0],
      [4, 0],
      [2, 2],
    ],
    [
      [0, 0],
      [25, 0],
      [25, 30],
      [0, 30],
    ],
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [2.05, 4],
      [2.05, 1],
      [1.95, 1],
      [1.95, 4],
      [0, 4],
    ],
  ].map((shape) => shape.map(([x, y]) => ({ x: x!, y: y! })))
  for (const points of shapes) {
    for (const ring of [points, points.toReversed(), [...points, points[0]!]]) {
      const rectangles = coverPolygonWithRects(ring, { maxSideOverhang: 0.3 })
      expect(getUncoveredPolygonArea(points, rectangles)).toBeLessThan(1e-6)
      expect(
        rectangles.every((rect) => rect.width > 0 && rect.height > 0),
      ).toBe(true)
    }
  }
  expect(
    coverPolygonWithRects(shapes[0]!, { maxSideOverhang: 0.3 }),
  ).toHaveLength(1)
  expect(
    coverPolygonWithRects(shapes[2]!, { maxSideOverhang: 0.3 }),
  ).toHaveLength(1)
  const notch = shapes[3]!
  const rectangles = coverPolygonWithRects(notch, { maxSideOverhang: 0.3 })
  expect(rectangles.some((rect) => containsPoint(rect, { x: 2, y: 3 }))).toBe(
    false,
  )
  expect(getUncoveredPolygonArea(notch, rectangles.slice(1))).toBeGreaterThan(
    0.01,
  )
  expect(
    renderPolygonCutoutCoverage({
      points: notch,
      rects: rectangles,
      title: "Cutout coverage preserves the 0.1 mm open notch",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
