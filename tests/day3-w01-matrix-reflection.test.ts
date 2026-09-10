import { test, expect } from "bun:test"
import { compose, flipX, translate, inverse, applyToPoint } from "transformation-matrix"

test("utils - matrix reflection and translation inversion stability", () => {
  const m = compose(flipX(), translate(30, -15))
  const inv = inverse(m)
  const pt = { x: 45, y: 60 }
  const forward = applyToPoint(m, pt)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(pt.x)
  expect(restored.y).toBeCloseTo(pt.y)
})
