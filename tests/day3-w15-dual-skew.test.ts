import { test, expect } from "bun:test"
import { compose, skewX, skewY, inverse, applyToPoint } from "transformation-matrix"

test("utils - dual axis skew composite pipeline transformation stability", () => {
  const m = compose(skewX(Math.PI / 12), skewY(Math.PI / 12))
  const inv = inverse(m)
  const p = { x: 30, y: -45 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
