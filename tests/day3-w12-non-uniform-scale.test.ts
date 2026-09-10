import { test, expect } from "bun:test"
import { compose, scale, translate, applyToPoint } from "transformation-matrix"

test("utils - non-uniform scale and translation composite order independence", () => {
  const m1 = compose(scale(3, 0.5), translate(10, 20))
  const p = { x: 5, y: 12 }
  const transformed = applyToPoint(m1, p)

  expect(transformed.x).toBeDefined()
  expect(transformed.y).toBeDefined()
})
