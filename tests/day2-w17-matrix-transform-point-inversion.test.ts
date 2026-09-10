import { test, expect } from "bun:test"
import { applyToPoint, inverse, type Matrix } from "transformation-matrix"

test("utils - matrix transform point inversion consistency", () => {
  const matrix: Matrix = {
    a: 2,
    b: 0,
    c: 0,
    d: 2,
    e: 10,
    f: 20,
  }
  const originalPoint = { x: 5, y: 15 }
  const transformed = applyToPoint(matrix, originalPoint)
  const invertedMatrix = inverse(matrix)
  const restoredPoint = applyToPoint(invertedMatrix, transformed)

  expect(restoredPoint.x).toBeCloseTo(originalPoint.x)
  expect(restoredPoint.y).toBeCloseTo(originalPoint.y)
})
