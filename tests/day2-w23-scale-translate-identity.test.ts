import { test, expect } from "bun:test"
import { compose, scale, translate, inverse, identity, applyToPoint } from "transformation-matrix"

test("utils - scale and translate inverse matrix reduction to identity", () => {
  const m = compose(scale(4, 4), translate(25, -50))
  const inv = inverse(m)
  const id = compose(m, inv)
  const point = { x: 75, y: 120 }
  const transformed = applyToPoint(id, point)

  expect(transformed.x).toBeCloseTo(point.x)
  expect(transformed.y).toBeCloseTo(point.y)
})
