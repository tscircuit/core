import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import {
  buildBusChannelPlan,
  validateBusChannelTraces,
} from "tests/fixtures/am62l-lpddr4-full-bga/bus-channel-plan"

const connection = (name: string, y: number) => ({
  name,
  pointsToConnect: [
    { x: -2, y, layer: "inner2" },
    { x: 2, y, layer: "inner2" },
  ],
})

test("interleaved buses on one layer retain global monotone lane order", () => {
  const input = {
    connections: [
      connection("a0", -1.5),
      connection("a1", 0.5),
      connection("b0", -0.5),
      connection("b1", 1.5),
    ],
    buses: [
      {
        busId: "a",
        connectionNames: ["a0", "a1"],
        preferredLayer: "inner2",
      },
      {
        busId: "b",
        connectionNames: ["b0", "b1"],
        preferredLayer: "inner2",
      },
    ],
  } as unknown as SimpleRouteJson
  const plan = buildBusChannelPlan(input)
  const traces = input.connections.map(
    (item): SimplifiedPcbTrace => ({
      type: "pcb_trace",
      pcb_trace_id: `trace-${item.name}`,
      connection_name: item.name,
      connectsTo: [],
      route: item.pointsToConnect.map((point) => ({
        route_type: "wire" as const,
        ...point,
        width: 0.08128,
      })),
    }),
  )

  expect(plan.orderedConnectionNames).toEqual(["a0", "b0", "a1", "b1"])
  expect(() => validateBusChannelTraces(input, plan, traces)).not.toThrow()
})
