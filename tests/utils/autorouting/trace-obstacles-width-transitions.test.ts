import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("wire width is retained next to vias and at width changes", () => {
  // Board-world points in mm: +X right, +Y up, right-handed.
  const trace: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_transition",
    route: [
      { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
      { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.8 },
      { route_type: "via", x: 4, y: 0, from_layer: "top", to_layer: "bottom" },
      { route_type: "wire", x: 4, y: 0, layer: "bottom", width: 0.4 },
      { route_type: "wire", x: 4, y: 3, layer: "bottom", width: 0.4 },
    ],
  }
  const obstacles = getObstaclesFromCircuitJson([trace])
  expect(obstacles).toHaveLength(5)
  expect(obstacles[0]).toMatchObject({ width: 2.8, height: 0.8 })
  expect(obstacles[1]).toMatchObject({ width: 2.8, height: 0.8 })
  expect(obstacles[2]).toMatchObject({ width: 0.4, height: 0.4 })
  expect(obstacles[3]).toMatchObject({
    center: { x: 4, y: 0 },
    width: 0.5,
    height: 0.5,
    layers: ["top", "bottom"],
  })
  expect(obstacles[4]).toMatchObject({
    width: 0.4,
    height: 3.4,
    layers: ["bottom"],
  })
  expect(
    obstacles.every((obstacle) =>
      obstacle.connectedTo.includes(trace.pcb_trace_id),
    ),
  ).toBe(true)
})
