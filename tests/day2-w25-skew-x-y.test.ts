import { test, expect } from "bun:test"
import { compose, skewDEG, applyToPoint } from "transformation-matrix"

test("utils - skewDEG angular matrix point transformation", () => {
  const s = skewDEG(45, 0)
  const point = { x: 10, y: 10 }
  const transformed = applyToPoint(s, point)
  expect(transformed.x).toBeCloseTo(20)
  expect(transformed.y).toBeCloseTo(10)
})
