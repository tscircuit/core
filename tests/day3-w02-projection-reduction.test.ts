import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - matrix 2D isometric projection reduction", () => {
  const m = compose(scale(1, 0.5), rotateDEG(45))
  const p = { x: 10, y: 10 }
  const transformed = applyToPoint(m, p)

  expect(transformed.x).toBeCloseTo(0)
  expect(transformed.y).toBeCloseTo(7.071, 2)
})
