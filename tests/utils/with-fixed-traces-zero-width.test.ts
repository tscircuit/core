import { expect, test } from "bun:test"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("withFixedTraces handles diagonal segments with zero or non-positive wire width without infinite loop or NaN obstacles", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [],
    connections: [],
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_diagonal_zero_width",
        connection_name: "net_1",
        route: [
          { route_type: "wire", x: 0, y: 0, width: 0, layer: "top" },
          { route_type: "wire", x: 2, y: 2, width: 0, layer: "top" },
        ],
      },
    ],
  }

  const result = withFixedTraces(input, new Set(["fixed_diagonal_zero_width"]))

  expect(result.traces).toHaveLength(0)
  expect(result.obstacles.length).toBeGreaterThan(0)
  for (const obs of result.obstacles) {
    expect(Number.isFinite(obs.center.x)).toBe(true)
    expect(Number.isFinite(obs.center.y)).toBe(true)
    expect(Number.isFinite(obs.width)).toBe(true)
    expect(Number.isFinite(obs.height)).toBe(true)
    expect(obs.width).toBeGreaterThan(0)
    expect(obs.height).toBeGreaterThan(0)
  }
})
