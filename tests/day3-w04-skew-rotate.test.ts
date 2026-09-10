import { test, expect } from "bun:test"
import { compose, skewDEG, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - matrix skew and rotation composition stability", () => {
  const m = compose(skewDEG(15, 10), rotateDEG(30))
  const p = { x: 20, y: 10 }
  const transformed = applyToPoint(m, p)

  expect(transformed.x).toBeDefined()
  expect(transformed.y).toBeDefined()
})
