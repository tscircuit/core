import { test, expect } from "bun:test"
import { compose, skewDEG, translate, inverse, applyToPoint } from "transformation-matrix"

test("utils - skew and translate composite transformation matrix stability", () => {
  const m = compose(skewDEG(10, 20), translate(-30, 45))
  const inv = inverse(m)
  const p = { x: 12, y: -28 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
