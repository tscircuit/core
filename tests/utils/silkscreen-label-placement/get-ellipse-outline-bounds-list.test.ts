import { expect, test } from "bun:test"
import { type Bounds, doBoundsOverlap } from "@tscircuit/math-utils"
import { getEllipseOutlineBoundsList } from "lib/utils/silkscreen-label-placement/label-geometry"

const isPointInBounds = (point: { x: number; y: number }, bounds: Bounds) =>
  point.x >= bounds.minX &&
  point.x <= bounds.maxX &&
  point.y >= bounds.minY &&
  point.y <= bounds.maxY

test("an ellipse outline's boxes cover the whole outline and leave its middle free", () => {
  const center = { x: 1, y: -2 }
  const [radiusX, radiusY, ccwRotation, strokeWidth] = [2, 1, 30, 0.1]
  const boundsList = getEllipseOutlineBoundsList({
    center,
    radiusX,
    radiusY,
    ccwRotation,
    strokeWidth,
  })

  const radians = (ccwRotation * Math.PI) / 180
  for (let i = 0; i < 360; i++) {
    const angle = (i * Math.PI) / 180
    const x = radiusX * Math.cos(angle)
    const y = radiusY * Math.sin(angle)
    const pointOnOutline = {
      x: center.x + x * Math.cos(radians) - y * Math.sin(radians),
      y: center.y + x * Math.sin(radians) + y * Math.cos(radians),
    }
    expect(
      boundsList.some((bounds) => isPointInBounds(pointOnOutline, bounds)),
    ).toBe(true)
  }

  const middle = {
    minX: center.x - 0.3,
    maxX: center.x + 0.3,
    minY: center.y - 0.2,
    maxY: center.y + 0.2,
  }
  expect(boundsList.some((bounds) => doBoundsOverlap(bounds, middle))).toBe(
    false,
  )
})
