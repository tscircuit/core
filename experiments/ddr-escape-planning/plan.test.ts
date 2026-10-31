import { expect, test } from "bun:test"
import { proposeEscapePlacement } from "./plan"

test("escape planning respects locked placement, checks physical feasibility, and does not mutate input", async () => {
  const placements = [
    { componentId: "decoupler", x: 0, y: 0, movable: true },
    { componentId: "processor", x: 5, y: 0, movable: false },
  ]
  const before = structuredClone(placements)
  const assess = async (candidate: typeof placements) => {
    const capacitor = candidate[0]
    // A footprint keepout excludes the positive direction. Only a negative
    // displacement opens the reserved via window in this small fixture.
    const placementValid = capacitor.y <= 0
    const feasible = capacitor.y <= -0.3
    return {
      placementValid,
      escapedConnections: feasible ? 2 : 1,
      requiredConnections: 2,
      jointlyFeasible: feasible,
      blockedBy: ["processor", "decoupler"],
    }
  }
  const options = {
    placements,
    offsets: [
      { x: 0, y: 0.3 },
      { x: 0, y: -0.3 },
      { x: 0, y: -1 },
    ],
    maxDisplacementMm: 0.4,
    maxEvaluations: 10,
    assess,
  }
  const result = await proposeEscapePlacement(options)
  expect(result.status).toBe("escape_feasible")
  expect(result.changes).toEqual([
    { componentId: "decoupler", from: { x: 0, y: 0 }, to: { x: 0, y: -0.3 } },
  ])
  expect(placements).toEqual(before)
  const locked = await proposeEscapePlacement({
    ...options,
    placements: placements.map((p) => ({ ...p, movable: false })),
  })
  expect(locked.status).toBe("blocked")
  expect(locked.changes).toEqual([])
})
