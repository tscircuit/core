import { test, expect } from "bun:test"
import { compose, scale, translate, inverse, applyToPoint } from "transformation-matrix"

test("utils - matrix scale and translate determinant preservation across inversion", () => {
  const m = compose(scale(0.5, 0.5), translate(-10, 40))
  const inv = inverse(m)
  const p = { x: 30, y: 70 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
