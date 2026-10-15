import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import {
  containsPoint,
  getUncoveredPolygonArea,
  renderPolygonCutoutCoverage,
} from "tests/fixtures/polygon-cutout-coverage"

test("polygon cutout output for thin slots, slopes, winding and open notches", () => {
  // Exercise the existing conversion boundary so the repro runs independently
  // of whichever polygon coverage implementation fixes the bug.
  const getCutoutRectangles = (points: { x: number; y: number }[]) =>
    getObstaclesFromCircuitJson([
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_0",
        center: { x: 0, y: 0 },
        width: 100,
        height: 100,
        num_layers: 2,
        thickness: 1.6,
        material: "fr4",
      },
      {
        type: "pcb_cutout",
        pcb_cutout_id: "pcb_cutout_polygon",
        shape: "polygon",
        points,
      },
    ])
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
  const expectedMissingAreas = [0, 0, 0, 0]
  const expectedRectangleCounts = [1, 7, 1, 3]
  for (const [shapeIndex, points] of shapes.entries()) {
    for (const ring of [points, points.toReversed(), [...points, points[0]!]]) {
      const rectangles = getCutoutRectangles(ring)
      expect(rectangles).toHaveLength(expectedRectangleCounts[shapeIndex]!)
      expect(getUncoveredPolygonArea(points, rectangles)).toBeCloseTo(
        expectedMissingAreas[shapeIndex]!,
        6,
      )
      expect(
        rectangles.every((rect) => rect.width > 0 && rect.height > 0),
      ).toBe(true)
    }
  }
  const notch = shapes[3]!
  const rectangles = getCutoutRectangles(notch)
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
      title: "Polygon cutout output around a 0.1 mm notch",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
