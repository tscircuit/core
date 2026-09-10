import { test, expect } from "bun:test"
import { compose, translate, inverse, applyToPoint } from "transformation-matrix"

test("utils - negative coordinate Cartesian quadrant translation stability", () => {
  const m = translate(-150, -250)
  const inv = inverse(m)
  const p = { x: -80, y: -45 }
  const forward = applyToPoint(m, p)
  const restored = applyToPoint(inv, forward)

  expect(forward.x).toBe(-230)
  expect(forward.y).toBe(-295)
  expect(restored.x).toBe(p.x)
  expect(restored.y).toBe(p.y)
})
