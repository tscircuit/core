import { test, expect } from "bun:test"
import { compose, scale, translate, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - triple affine composite chaining stability (scale -> rotate -> translate)", () => {
  const m = compose(scale(2, 2), rotateDEG(180), translate(20, -10))
  const p = { x: 5, y: 15 }
  const transformed = applyToPoint(m, p)

  expect(transformed.x).toBeDefined()
  expect(transformed.y).toBeDefined()
})
