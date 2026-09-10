import { test, expect } from "bun:test"
import { compose, flipX, flipY, applyToPoint } from "transformation-matrix"

test("utils - flipX and flipY matrix transform composition", () => {
  const fx = flipX()
  const fy = flipY()
  const combined = compose(fx, fy)
  const point = { x: 12, y: -8 }
  const transformed = applyToPoint(combined, point)

  expect(transformed.x).toBe(-12)
  expect(transformed.y).toBe(8)
})
