import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

test("withFixedTraces does not infinite loop when diagonal wire width is 0", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "trace_zero_width",
        route: [
          { route_type: "wire", x: 0, y: 0, width: 0, layer: "top" },
          { route_type: "wire", x: 2, y: 2, width: 0, layer: "top" },
        ],
      },
    ],
  }

  const result = withFixedTraces(input, new Set(["trace_zero_width"]))
  expect(result.obstacles.length).toBeGreaterThan(0)
  expect(
    result.obstacles.every(
      (o) => Number.isFinite(o.center.x) && Number.isFinite(o.width),
    ),
  ).toBe(true)
})
