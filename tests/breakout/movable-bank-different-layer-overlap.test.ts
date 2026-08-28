import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable banks permit coincident tangent spans on different copper layers", () => {
  const output = planImplicitBreakoutBanks(
    createMovableBankFixture({
      buses: [
        { busId: "data", count: 5, layer: "inner2", sourceTangentCenter: 0 },
        { busId: "control", count: 5, layer: "bottom", sourceTangentCenter: 0 },
      ],
    }),
  )
  expect(output.bankPlan.assignments.map((bank) => bank.tangentPitch)).toEqual([
    2, 2,
  ])
  expect(
    output.bankPlan.assignments.map((bank) => bank.tangentShift),
  ).toEqual([0, 0])
})
