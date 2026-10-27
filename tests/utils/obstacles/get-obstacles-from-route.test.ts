import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getObstaclesFromRoute } from "lib/utils/obstacles/getObstaclesFromRoute"

test("getObstaclesFromRoute covers wire copper, vias and repeated points", () => {
  // Board-world mm: a diagonal wire, a via with wire points repeated on both
  // sides, then an interpolated taper on an inner layer of a 4 layer board
  const route = [
    { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
    { route_type: "wire", x: 3, y: 4, width: 0.2, layer: "top" },
    {
      route_type: "via",
      x: 3,
      y: 4,
      from_layer: "top",
      to_layer: "inner2",
      outer_diameter: 0.6,
    },
    { route_type: "wire", x: 3, y: 4, width: 0.3, layer: "inner2" },
    { route_type: "wire", x: 3, y: 4, width: 0.3, layer: "inner2" },
    { route_type: "wire", x: 3, y: 8, width: 0.5, layer: "inner2" },
  ] satisfies PcbTraceRoutePoint[]

  const obstacles = getObstaclesFromRoute(route, "source_trace_0", {
    layerCount: 4,
    routeThicknessMode: "interpolated",
  })

  expect(obstacles).toEqual([
    {
      type: "rect",
      layers: ["top"],
      center: { x: 1.5, y: 2 },
      width: 5.2,
      height: 0.2,
      ccwRotationDegrees: (Math.atan2(4, 3) * 180) / Math.PI,
      connectedTo: ["source_trace_0"],
    },
    {
      type: "rect",
      layers: ["top", "inner1", "inner2"],
      center: { x: 3, y: 4 },
      width: 0.6,
      height: 0.6,
      connectedTo: ["source_trace_0"],
    },
    {
      type: "rect",
      layers: ["inner2"],
      center: { x: 3, y: 4 },
      width: 0.3,
      height: 0.3,
      connectedTo: ["source_trace_0"],
    },
    {
      type: "rect",
      layers: ["inner2"],
      center: { x: 3, y: 6 },
      width: 0.5,
      height: 4.5,
      connectedTo: ["source_trace_0"],
    },
  ])
  for (const obstacle of obstacles) {
    expect(obstacle.width).toBeGreaterThan(0)
    expect(obstacle.height).toBeGreaterThan(0)
  }
})
