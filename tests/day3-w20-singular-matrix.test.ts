import { test, expect } from "bun:test"
import { compose, scale, translate, applyToPoint } from "transformation-matrix"

test("utils - transformation matrix non-zero scaling coordinate projection", () => {
  const m = compose(scale(0.001, 0.001), translate(1000, 1000))
  const p = { x: 50, y: 50 }
  const projected = applyToPoint(m, p)

  expect(projected.x).toBeDefined()
  expect(projected.y).toBeDefined()
})
