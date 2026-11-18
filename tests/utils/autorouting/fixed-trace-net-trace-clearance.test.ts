import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

// Board-world millimeters: +X right, +Y up; all coordinates are points.
test("fixed trace obstacles keep the trace's net clearance", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_rf",
        connection_name: "rf",
        minTraceClearance: 0.4,
        route: [
          { route_type: "wire", x: -1, y: 0, width: 0.2, layer: "top" },
          // Diagonal segment: rasterized rectangles plus end caps.
          { route_type: "wire", x: 0, y: 1, width: 0.2, layer: "top" },
          {
            route_type: "via",
            x: 0,
            y: 1,
            from_layer: "top",
            to_layer: "bottom",
            via_diameter: 0.6,
          },
          // Axis-aligned segment.
          { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "bottom" },
        ],
      },
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_default",
        connection_name: "default",
        route: [
          { route_type: "wire", x: -1, y: -1, width: 0.2, layer: "top" },
          { route_type: "wire", x: 1, y: -1, width: 0.2, layer: "top" },
        ],
      },
    ],
  }

  const output = withFixedTraces(input, new Set(["fixed_rf", "fixed_default"]))

  const rfObstacles = output.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes("rf"),
  )
  expect(rfObstacles.some((obstacle) => obstacle.shape === "circle")).toBe(true)
  expect(rfObstacles.length).toBeGreaterThan(3)
  expect(new Set(rfObstacles.map((o) => o.minTraceClearance))).toEqual(
    new Set([0.4]),
  )

  const defaultObstacles = output.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes("default"),
  )
  expect(defaultObstacles).toHaveLength(1)
  expect(defaultObstacles[0]).not.toHaveProperty("minTraceClearance")
})
