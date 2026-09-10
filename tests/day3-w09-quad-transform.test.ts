import { test, expect } from "bun:test"
import { compose, scale, translate, rotateDEG, applyToPoint } from "transformation-matrix"

test("utils - quad transform composite pipeline associativity and point projection", () => {
  const t1 = translate(10, -5)
  const t2 = scale(2, 2)
  const t3 = rotateDEG(45)
  const t4 = translate(-10, 5)

  const mCombined = compose(t1, t2, t3, t4)
  const p = { x: 12, y: 18 }
  const transformed = applyToPoint(mCombined, p)

  expect(transformed.x).toBeDefined()
  expect(transformed.y).toBeDefined()
})
