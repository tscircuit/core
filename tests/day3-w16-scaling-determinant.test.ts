import { test, expect } from "bun:test"
import { compose, scale, translate, inverse, applyToPoint } from "transformation-matrix"

test("utils - scaling determinant preservation under translational coordinate displacement", () => {
  const m = compose(scale(4, 4), translate(100, -200))
  const inv = inverse(m)
  const p = { x: 50, y: 75 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
