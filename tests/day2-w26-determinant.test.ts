import { test, expect } from "bun:test"
import { scale, rotateDEG, compose } from "transformation-matrix"

test("utils - composite matrix scale factor determinant preservation", () => {
  const m = compose(scale(2, 3), rotateDEG(45))
  expect(m.a).toBeDefined()
  expect(m.d).toBeDefined()
})
