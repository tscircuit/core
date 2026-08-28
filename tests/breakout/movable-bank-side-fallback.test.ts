import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable bank falls back from a blocked channel-facing side", () => {
  const fixture = createMovableBankFixture({
    buses: [{ busId: "data", count: 3, layer: "inner2" }],
    channelGap: 0.5,
  })
  const output = planImplicitBreakoutBanks({
    ...fixture,
    context: {
      ...fixture.context,
      obstacles: [
        {
          id: "left-facing-edge",
          bounds: { minX: -0.5, maxX: 0, minY: -15, maxY: 15 },
        },
        {
          id: "right-facing-edge",
          bounds: { minX: 0, maxX: 0.5, minY: -15, maxY: 15 },
        },
      ],
    },
  })
  expect(new Set(Object.values(output.bankPlan.assignments[0]!.sideByRegionId))).toEqual(
    new Set(["top"]),
  )
})
