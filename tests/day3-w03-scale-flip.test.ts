import { test, expect } from "bun:test"
import { compose, scale, flipY, applyToPoint } from "transformation-matrix"

test("utils - matrix scale and flipY composition point transform", () => {
  const m = compose(scale(3, 2), flipY())
  const p = { x: 5, y: 10 }
  const transformed = applyToPoint(m, p)

  expect(transformed.x).toBeCloseTo(15)
  expect(transformed.y).toBeCloseTo(-20)
})
