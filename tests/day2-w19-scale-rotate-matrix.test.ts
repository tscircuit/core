import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - scale and rotate matrix composition", () => {
  const s = scale(2, 2)
  const r = rotateDEG(90)
  const combined = compose(s, r)
  const point = { x: 10, y: 0 }
  const transformed = applyToPoint(combined, point)

  expect(transformed.x).toBeCloseTo(0)
  expect(transformed.y).toBeCloseTo(20)
})
