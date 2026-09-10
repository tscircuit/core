import { test, expect } from "bun:test"
import { compose, shear, inverse, applyToPoint } from "transformation-matrix"

test("utils - shearing angle matrix transform coordinate restoration", () => {
  const m = shear(0.2, 0.4)
  const inv = inverse(m)
  const p = { x: 18, y: -24 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
