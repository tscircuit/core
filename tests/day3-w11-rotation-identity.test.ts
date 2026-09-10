import { test, expect } from "bun:test"
import { compose, rotateDEG, identity, applyToPoint } from "transformation-matrix"

test("utils - 360-degree rotation matrix identity loop reconciliation", () => {
  const fullTurn = rotateDEG(360)
  const fourQuarterTurns = compose(rotateDEG(90), rotateDEG(90), rotateDEG(90), rotateDEG(90))
  const p = { x: 42.5, y: -88.1 }

  const ptTurn = applyToPoint(fullTurn, p)
  const ptQuarters = applyToPoint(fourQuarterTurns, p)

  expect(ptTurn.x).toBeCloseTo(p.x)
  expect(ptTurn.y).toBeCloseTo(p.y)
  expect(ptQuarters.x).toBeCloseTo(p.x)
  expect(ptQuarters.y).toBeCloseTo(p.y)
})
