import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { buildBusChannelPlan } from "tests/fixtures/am62l-lpddr4-full-bga/bus-channel-plan"

test("opposing endpoint array direction is mirrored once without reversing bus rank", () => {
  const input = {
    connections: [
      {
        name: "dq0",
        pointsToConnect: [
          { x: 2, y: -0.5, layer: "inner2" },
          { x: -2, y: -0.5, layer: "inner2" },
        ],
      },
      {
        name: "dq1",
        pointsToConnect: [
          { x: 2, y: 0.5, layer: "inner2" },
          { x: -2, y: 0.5, layer: "inner2" },
        ],
      },
    ],
    buses: [
      {
        busId: "byte0",
        connectionNames: ["dq0", "dq1"],
        preferredLayer: "inner2",
      },
    ],
  } as unknown as SimpleRouteJson

  expect(buildBusChannelPlan(input).assignments).toEqual([
    {
      busId: "byte0",
      selectedLayer: "inner2",
      connectionNamesInWindingOrder: ["dq0", "dq1"],
    },
  ])

  const reversed = structuredClone(input)
  reversed.connections[0]!.pointsToConnect[0]!.y = 0.5
  reversed.connections[1]!.pointsToConnect[0]!.y = -0.5
  expect(() => buildBusChannelPlan(reversed)).toThrow(
    'Bus channel "byte0" reverses winding between package breakouts',
  )
})
