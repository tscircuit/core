import { test, expect } from "bun:test"
import { compose, translate, applyToPoint } from "transformation-matrix"

test("utils - cumulative 4-stage chained translation composition", () => {
  const m = compose(translate(5, 5), translate(10, -5), translate(-3, 2), translate(8, 8))
  const p = { x: 0, y: 0 }
  const transformed = applyToPoint(m, p)
  expect(transformed.x).toBe(20)
  expect(transformed.y).toBe(10)
})
