import { test, expect } from "bun:test"
import { rotateDEG, compose, applyToPoint } from "transformation-matrix"

test("utils - 180 and 270 degree rotational transform quadrant mapping", () => {
  const r180 = rotateDEG(180)
  const r90 = rotateDEG(90)
  const r270 = compose(r180, r90)
  const point = { x: 5, y: 10 }
  const p180 = applyToPoint(r180, point)
  const p270 = applyToPoint(r270, point)

  expect(p180.x).toBeCloseTo(-5)
  expect(p180.y).toBeCloseTo(-10)
  expect(p270.x).toBeCloseTo(10)
  expect(p270.y).toBeCloseTo(-5)
})
