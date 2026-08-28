import { expect, test } from "bun:test"
import { planImplicitBreakoutBusLayers } from "../../lib/components/primitive-components/Breakout/plan-implicit-breakout-bus-layers"

test("rejects buses without a common layer or with overlapping membership", () => {
  expect(() =>
    planImplicitBreakoutBusLayers([
      { busId: "byte0", connectionIds: ["dq0"], targetLayers: [] },
    ]),
  ).toThrow('Implicit breakout bus "byte0" has no common layer')

  expect(() =>
    planImplicitBreakoutBusLayers([
      {
        busId: "byte0",
        connectionIds: ["shared"],
        targetLayers: ["inner2"],
      },
      {
        busId: "byte1",
        connectionIds: ["shared"],
        targetLayers: ["inner3"],
      },
    ]),
  ).toThrow(
    'Implicit breakout connection "shared" belongs to both bus "byte0" and bus "byte1"',
  )
})
