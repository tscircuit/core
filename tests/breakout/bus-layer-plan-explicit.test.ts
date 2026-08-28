import { expect, test } from "bun:test"
import { planImplicitBreakoutBusLayers } from "../../lib/components/primitive-components/Breakout/plan-implicit-breakout-bus-layers"

test("keeps explicit whole-bus layer assignments immutable", () => {
  const plans = planImplicitBreakoutBusLayers([
    {
      busId: "byte0",
      connectionIds: ["dq0", "dq1"],
      targetLayers: ["inner2"],
    },
    {
      busId: "command",
      connectionIds: ["ca0", "reset"],
      targetLayers: ["bottom"],
    },
  ])

  expect(plans).toEqual([
    {
      assignments: [
        {
          busId: "byte0",
          connectionIds: ["dq0", "dq1"],
          selectedLayer: "inner2",
          preferenceRank: 0,
        },
        {
          busId: "command",
          connectionIds: ["ca0", "reset"],
          selectedLayer: "bottom",
          preferenceRank: 0,
        },
      ],
    },
  ])
  expect(Object.isFrozen(plans)).toBe(true)
  expect(Object.isFrozen(plans[0]!.assignments)).toBe(true)
  expect(Object.isFrozen(plans[0]!.assignments[0]!.connectionIds)).toBe(true)
})
