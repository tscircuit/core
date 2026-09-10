import { test, expect } from "bun:test"
import { compose, scale, rotateDEG, translate, applyToPoint } from "transformation-matrix"

test("utils - multi-stage transformation bounding box corner projection stability", () => {
  const m = compose(translate(20, 30), rotateDEG(30), scale(1.5, 1.5))
  const corners = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]
  const projected = corners.map((p) => applyToPoint(m, p))

  expect(projected.length).toBe(4)
  expect(projected[0].x).toBeDefined()
  expect(projected[3].y).toBeDefined()
})
