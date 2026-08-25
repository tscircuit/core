import { expect, test } from "bun:test"
import {
  type FanoutPhaseRegion,
  findFanoutPhaseSeparationConflict,
} from "lib/components/primitive-components/Group/find-fanout-phase-separation-conflict"

const createRegion = (
  name: string,
  bounds: FanoutPhaseRegion["bounds"],
): FanoutPhaseRegion => ({
  name,
  bounds,
  boundaryKeepaway: 0.25,
})

test("fanout phase regions require a via-safe horizontal or vertical gap", () => {
  const firstRegion = createRegion("first", {
    minX: 0,
    maxX: 1,
    minY: 0,
    maxY: 1,
  })
  const horizontalConflict = findFanoutPhaseSeparationConflict([
    firstRegion,
    createRegion("horizontal", {
      minX: 1.49,
      maxX: 2.49,
      minY: 0,
      maxY: 1,
    }),
  ])
  expect(horizontalConflict).toMatchObject({
    availableGap: 0.49,
    requiredGap: 0.5,
  })

  const verticalConflict = findFanoutPhaseSeparationConflict([
    firstRegion,
    createRegion("vertical", {
      minX: 0,
      maxX: 1,
      minY: 1.49,
      maxY: 2.49,
    }),
  ])
  expect(verticalConflict).toMatchObject({
    availableGap: 0.49,
    requiredGap: 0.5,
  })

  expect(
    findFanoutPhaseSeparationConflict([
      firstRegion,
      createRegion("safe", {
        minX: 1.504,
        maxX: 2.504,
        minY: 0,
        maxY: 1,
      }),
    ]),
  ).toBeUndefined()
})
