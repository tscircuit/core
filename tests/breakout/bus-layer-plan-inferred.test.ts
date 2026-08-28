import { expect, test } from "bun:test"
import { planImplicitBreakoutBusLayers } from "../../lib/components/primitive-components/Breakout/plan-implicit-breakout-bus-layers"

test("infers deterministic congestion-aware whole-bus layer candidates", () => {
  const byte0 = {
    busId: "byte0",
    connectionIds: ["dq0", "dq1"],
    targetLayers: ["inner2", "inner3"],
  }
  const byte1 = {
    busId: "byte1",
    connectionIds: ["dq8", "dq9"],
    targetLayers: ["inner2", "inner3"],
  }

  const ordered = planImplicitBreakoutBusLayers([byte0, byte1])
  const shuffled = planImplicitBreakoutBusLayers([byte1, byte0])

  expect(ordered).toEqual(shuffled)
  expect(
    ordered[0]!.assignments.map(({ busId, selectedLayer }) => ({
      busId,
      selectedLayer,
    })),
  ).toEqual([
    { busId: "byte0", selectedLayer: "inner2" },
    { busId: "byte1", selectedLayer: "inner3" },
  ])
  expect(ordered).toHaveLength(4)
})
