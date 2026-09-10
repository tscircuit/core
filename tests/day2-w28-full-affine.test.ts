import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, translate, applyToPoint } from "transformation-matrix"

test("utils - full affine pipeline composition (scale, rotate, translate)", () => {
  const m = compose(scale(2, 2), rotateDEG(90), translate(10, 20))
  const p = { x: 5, y: 5 }
  const transformed = applyToPoint(m, p)
  expect(transformed.x).toBeCloseTo(-50)
  expect(transformed.y).toBeCloseTo(30)
})
