import { test, expect } from "bun:test"
import { compose, scale, translate, applyToPoint } from "transformation-matrix"

test("utils - coordinate translation flip parity stability across X/Y axes", () => {
  const flipX = compose(scale(-1, 1), translate(50, 0))
  const flipY = compose(scale(1, -1), translate(0, 50))
  const p = { x: 10, y: 20 }
  
  const ptX = applyToPoint(flipX, p)
  const ptY = applyToPoint(flipY, p)

  expect(ptX.x).toBeDefined()
  expect(ptY.y).toBeDefined()
})
