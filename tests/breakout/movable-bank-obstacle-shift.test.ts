import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("movable bank shifts its tangent centroid to clear a fixed obstacle", () => {
  const fixture = createMovableBankFixture({
    buses: [{ busId: "data", count: 3, layer: "inner1" }],
    channelGap: 0.5,
  })
  const output = planImplicitBreakoutBanks({
    ...fixture,
    context: {
      ...fixture.context,
      obstacles: [
        {
          id: "center-obstacle",
          bounds: { minX: -0.5, maxX: 0, minY: -0.25, maxY: 0.25 },
        },
        {
          id: "right-center-obstacle",
          bounds: { minX: 0, maxX: 0.5, minY: -0.25, maxY: 0.25 },
        },
      ],
    },
  })
  expect(Math.abs(output.bankPlan.assignments[0]!.tangentShift)).toBeGreaterThan(
    0,
  )
})
