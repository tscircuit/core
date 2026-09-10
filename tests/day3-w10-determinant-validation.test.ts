import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, inverse, applyToPoint } from "transformation-matrix"

test("utils - transformation matrix determinant non-zero singular point inversion", () => {
  const m = compose(scale(3, -2), rotateDEG(90))
  const inv = inverse(m)
  const p = { x: -14, y: 28 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
