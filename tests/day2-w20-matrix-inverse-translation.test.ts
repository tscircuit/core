import { test, expect } from "bun:test"
import { compose, translate, scale, inverse, applyToPoint } from "transformation-matrix"

test("utils - matrix inversion with translation and scaling", () => {
  const m = compose(translate(50, -30), scale(3, 3))
  const inv = inverse(m)
  const pt = { x: 100, y: 200 }
  const forward = applyToPoint(m, pt)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(pt.x)
  expect(restored.y).toBeCloseTo(pt.y)
})
