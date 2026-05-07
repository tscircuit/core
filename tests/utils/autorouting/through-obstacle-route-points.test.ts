import { expect, test } from "bun:test"
import { pcb_trace } from "circuit-json"
import { replaceThroughObstacleRoutePoints } from "lib/utils/autorouting/mergeRoutes"

test("replaces through_obstacle route points before writing pcb_trace routes", () => {
  const route = replaceThroughObstacleRoutePoints([
    { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
    {
      route_type: "through_obstacle",
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      from_layer: "top",
      to_layer: "inner1",
      width: 0.15,
    },
    { route_type: "wire", x: 2, y: 0, width: 0.15, layer: "inner1" },
  ])

  expect(route).toEqual([
    { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
    { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "inner1" },
    { route_type: "wire", x: 1, y: 0, width: 0.15, layer: "inner1" },
    { route_type: "wire", x: 2, y: 0, width: 0.15, layer: "inner1" },
  ])

  expect(
    pcb_trace.safeParse({
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_0",
      route,
    }).success,
  ).toBe(true)
})
