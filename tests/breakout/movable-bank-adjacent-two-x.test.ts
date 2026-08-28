import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable banks replace adjacent one-pitch conflicts with two-pitch ordered banks", () => {
  const fixture = createMovableBankFixture({
    buses: [
      { busId: "first", count: 2, layer: "inner1", sourceTangentCenter: 0 },
      { busId: "second", count: 2, layer: "inner1", sourceTangentCenter: 0 },
    ],
  })
  const output = planImplicitBreakoutBanks(fixture)
  expect(output.bankPlan.assignments.map((bank) => bank.tangentPitch)).toEqual([
    2, 2,
  ])
  const leftPoints = output.breakoutPoints.filter(
    (point) => point.regionId === "left-package",
  )
  expect(new Set(leftPoints.map((point) => `${point.x}:${point.y}`)).size).toBe(
    4,
  )
})
