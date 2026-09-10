import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - diagonal axis reflection composite transformation determinant parity", () => {
  const reflectDiagonal = compose(rotateDEG(45), scale(1, -1), rotateDEG(-45))
  const p = { x: 15, y: 35 }
  const transformed = applyToPoint(reflectDiagonal, p)

  expect(transformed.x).toBeCloseTo(35)
  expect(transformed.y).toBeCloseTo(15)
})
