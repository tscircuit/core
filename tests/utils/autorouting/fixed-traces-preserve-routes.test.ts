import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

test("fixed traces retain their routes, metadata, and physical via spans", () => {
  const input: SimpleRouteJson = {
    layerCount: 6,
    minTraceWidth: 0.1,
    bounds: { minX: -1, maxX: 5, minY: -1, maxY: 5 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_data",
        connection_name: "DDR_DQ0",
        connectsTo: ["cpu_dq0", "ram_dq0"],
        route: [
          { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
          { route_type: "wire", x: 4, y: 4, width: 0.1, layer: "top" },
          {
            route_type: "via",
            x: 4,
            y: 4,
            from_layer: "top",
            to_layer: "inner1",
            layers: ["top", "inner1", "inner2", "inner3", "inner4", "bottom"],
            via_diameter: 0.4,
            via_hole_diameter: 0.2,
          },
          { route_type: "wire", x: 4, y: 4, width: 0.1, layer: "inner1" },
        ],
      },
      {
        type: "pcb_trace",
        pcb_trace_id: "editable_data",
        connection_name: "GPIO",
        route: [
          { route_type: "wire", x: 0, y: 4, width: 0.1, layer: "top" },
          { route_type: "wire", x: 4, y: 0, width: 0.1, layer: "top" },
        ],
      },
    ],
  }
  const originalInput = structuredClone(input)
  const output = withFixedTraces(input, new Set(["fixed_data"]))

  expect(output.obstacles).toBe(input.obstacles)
  expect(output.traces).toHaveLength(2)
  expect(output.traces![0]).toEqual({ ...input.traces![0], isFixed: true })
  expect(output.traces![1]).toBe(input.traces![1])
  expect(input).toEqual(originalInput)
})
