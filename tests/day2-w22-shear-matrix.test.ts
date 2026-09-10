import { test, expect } from "bun:test"
import { shear, applyToPoint } from "transformation-matrix"

test("utils - shear matrix transformation point calculation", () => {
  const s = shear(0.5, 0.2)
  const point = { x: 10, y: 20 }
  const transformed = applyToPoint(s, point)

  expect(transformed.x).toBe(20)
  expect(transformed.y).toBe(22)
})
