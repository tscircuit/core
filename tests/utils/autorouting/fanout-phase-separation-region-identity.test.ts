import { expect, test } from "bun:test"
import {
  type FanoutPhaseRegion,
  findFanoutPhaseSeparationConflict,
} from "lib/components/primitive-components/Group/find-fanout-phase-separation-conflict"

test("fanout separation sums each region's keepaway and deduplicates one physical region", () => {
  const firstRegion: FanoutPhaseRegion = {
    name: "first",
    regionId: "shared",
    bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    boundaryKeepaway: 0.2,
  }
  const secondRegion: FanoutPhaseRegion = {
    name: "second",
    regionId: "other",
    bounds: { minX: 1.5, maxX: 2.5, minY: 0, maxY: 1 },
    boundaryKeepaway: 0.3,
  }

  expect(
    findFanoutPhaseSeparationConflict([firstRegion, secondRegion]),
  ).toBeUndefined()
  const conflict = findFanoutPhaseSeparationConflict([
    firstRegion,
    { ...secondRegion, bounds: { ...secondRegion.bounds, minX: 1.499 } },
  ])
  expect(conflict?.availableGap).toBeCloseTo(0.499)
  expect(conflict?.requiredGap).toBe(0.5)
  expect(
    findFanoutPhaseSeparationConflict([
      firstRegion,
      { ...secondRegion, regionId: "shared" },
    ]),
  ).toBeUndefined()
})
