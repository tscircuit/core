import { test, expect } from "bun:test"
import { compose, scale, translate, rotateDEG, inverse, applyToPoint } from "transformation-matrix"

test("utils - inverse transformation composite associativity stability", () => {
  const a = translate(15, -25)
  const b = rotateDEG(60)
  const c = scale(2.5, 2.5)

  const forward = compose(a, b, c)
  const inv = inverse(forward)
  const p = { x: 35, y: -70 }

  const forwardPt = applyToPoint(forward, p)
  const restored = applyToPoint(inv, forwardPt)

  expect(restored.x).toBeCloseTo(p.x)
  expect(restored.y).toBeCloseTo(p.y)
})
