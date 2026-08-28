import { expect, test } from "bun:test"
import { planImplicitBreakoutBanks } from "lib/components/primitive-components/Breakout/plan-implicit-breakout-banks"
import { createMovableBankFixture } from "./fixtures/movable-bank-fixture"

test("opposing movable banks align every connection identity and rank", () => {
  const output = planImplicitBreakoutBanks(
    createMovableBankFixture({
      buses: [{ busId: "data", count: 5, layer: "inner2" }],
    }),
  )
  const pointsByConnectionId = Map.groupBy(
    output.breakoutPoints,
    (point) => point.connectionId,
  )
  expect(
    [...pointsByConnectionId.values()].every(
      (points) => points.length === 2 && points[0]!.y === points[1]!.y,
    ),
  ).toBe(true)
  expect(output.bankPlan.assignments[0]!.connectionIdsInWindingOrder).toEqual([
    "data-lane-0",
    "data-lane-1",
    "data-lane-2",
    "data-lane-3",
    "data-lane-4",
  ])
})
