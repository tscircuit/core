import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("throws when source_trace lacks matching pcb_trace", () => {
  const soup = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_0",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
    },
  ] as any

  expect(() => getObstaclesFromCircuitJson(soup)).toThrow()
})
