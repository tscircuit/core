import { test, expect } from "bun:test"
import { compose, translate, applyToPoint } from "transformation-matrix"

test("utils - translate matrix composition chaining", () => {
  const t1 = translate(10, 20)
  const t2 = translate(-5, 15)
  const combined = compose(t1, t2)
  const point = { x: 0, y: 0 }
  const transformed = applyToPoint(combined, point)

  expect(transformed.x).toBe(5)
  expect(transformed.y).toBe(35)
})
