import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

test("withFixedTraces terminates without hanging when a diagonal segment has zero or non-positive width", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "zero_width_diagonal",
        connection_name: "test",
        route: [
          { route_type: "wire", x: 0, y: 0, width: 0, layer: "top" },
          { route_type: "wire", x: 2, y: 2, width: 0, layer: "top" },
        ],
      },
      {
        type: "pcb_trace",
        pcb_trace_id: "negative_width_diagonal",
        connection_name: "test2",
        route: [
          { route_type: "wire", x: 0, y: 0, width: -1, layer: "top" },
          { route_type: "wire", x: 3, y: 3, width: -1, layer: "top" },
        ],
      },
    ],
  }

  const output = withFixedTraces(
    input,
    new Set(["zero_width_diagonal", "negative_width_diagonal"]),
  )
  expect(output.traces).toEqual([])
  expect(output.obstacles.length).toBeGreaterThan(0)
})
