import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("two same-layer eleven-lane banks maximize pitch below two-x on a 30 mm board", () => {
  const output = planImplicitBreakoutBanks(
    createMovableBankFixture({
      buses: [
        { busId: "byte0", count: 11, layer: "inner2" },
        { busId: "byte1", count: 11, layer: "inner2" },
      ],
      channelGap: 0.5,
    }),
  )
  const pitches = output.bankPlan.assignments.map((bank) => bank.tangentPitch)
  expect(Math.min(...pitches)).toBe(1.375)
})
