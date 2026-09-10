import { test, expect } from "bun:test"
import { compose, shear, scale, inverse, applyToPoint } from "transformation-matrix"

test("utils - shear and scale composite transformation matrix stability", () => {
  const m = compose(shear(0.15, 0.25), scale(2, 2))
  const inv = inverse(m)
  const p = { x: 20, y: -35 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
