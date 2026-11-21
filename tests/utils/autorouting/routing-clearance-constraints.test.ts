import { expect, test } from "bun:test"
import { Group_applyDrcTolerancesToSimpleRouteJson } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("trace clearance preserves independent spacing rules and phase overrides", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
    minTraceToPadEdgeClearance: 0.6,
    minTraceToHoleEdgeClearance: 0.21,
    minViaEdgeToPadEdgeClearance: 0.22,
    minViaHoleEdgeToViaHoleEdgeClearance: 0.23,
    minPlatedHoleDrillEdgeToDrillEdgeClearance: 0.24,
    minPadEdgeToPadEdgeClearance: 0.25,
    minBoardEdgeClearance: 0.26,
    minViaDiameter: 0.7,
  }
  expect(
    Group_applyDrcTolerancesToSimpleRouteJson(input, undefined, "0.8mm"),
  ).toEqual({ ...input, minTraceToPadEdgeClearance: 0.8 })
  const resolved = Group_applyDrcTolerancesToSimpleRouteJson(
    input,
    {
      minTraceToPadEdgeClearance: 0.2,
      minTraceToHoleEdgeClearance: 0.3,
      minBoardEdgeClearance: 0.4,
    },
    "0.35mm",
  )
  expect(resolved).toMatchObject({
    minTraceToPadEdgeClearance: 0.35,
    minTraceToHoleEdgeClearance: 0.3,
    minBoardEdgeClearance: 0.4,
    minViaEdgeToPadEdgeClearance: 0.22,
    minViaHoleEdgeToViaHoleEdgeClearance: 0.23,
    minPlatedHoleDrillEdgeToDrillEdgeClearance: 0.24,
    minPadEdgeToPadEdgeClearance: 0.25,
  })
  expect(input.minTraceToPadEdgeClearance).toBe(0.6)
})
