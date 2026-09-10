import { test, expect } from "bun:test"
import { compose, scale, skewDEG, inverse, applyToPoint } from "transformation-matrix"

test("utils - 2D skew-scale matrix inverse reconciliation", () => {
  const m = compose(scale(1.5, 0.8), skewDEG(15, 0))
  const inv = inverse(m)
  const p = { x: 25, y: -40 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
