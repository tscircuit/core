import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { getObstaclesFromSrjTraces } from "lib/utils/autorouting/getObstaclesFromSrjTraces"

test("preserved SRJ traces become connected fixed-copper obstacles", () => {
  const trace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_child",
    connectsTo: ["pcb_port_a", "attachment_point_a"],
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
      {
        route_type: "via",
        x: 2,
        y: 2,
        from_layer: "top",
        to_layer: "bottom",
        via_diameter: 0.6,
      },
      {
        route_type: "through_obstacle",
        start: { x: 3, y: 2 },
        end: { x: 4, y: 2 },
        from_layer: "top",
        to_layer: "bottom",
        width: 0.2,
      },
    ],
  }

  const obstacles = getObstaclesFromSrjTraces({
    traces: [trace],
    layerCount: 4,
    viaDiameter: 0.5,
  })

  expect(obstacles.slice(0, 2)).toEqual([
    {
      obstacleId: "pcb_trace_child_3_via",
      type: "rect",
      shape: "circle",
      layers: ["top", "inner1", "inner2", "bottom"],
      center: { x: 2, y: 2 },
      width: 0.6,
      height: 0.6,
      connectedTo: ["pcb_port_a", "attachment_point_a"],
    },
    {
      obstacleId: "pcb_trace_child_4_through",
      type: "rect",
      layers: ["top", "inner1", "inner2", "bottom"],
      center: { x: 3.5, y: 2 },
      width: 1,
      height: 0.2,
      connectedTo: ["pcb_port_a", "attachment_point_a"],
    },
  ])
  const diagonalObstacles = obstacles.slice(2)
  expect(diagonalObstacles).toHaveLength(4)
  expect(diagonalObstacles.map((obstacle) => obstacle.center)).toEqual([
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.75 },
    { x: 1.25, y: 1.25 },
    { x: 1.75, y: 1.75 },
  ])
  expect(
    diagonalObstacles.every(
      (obstacle) =>
        obstacle.ccwRotationDegrees === undefined &&
        obstacle.connectedTo.includes("attachment_point_a"),
    ),
  ).toBe(true)
})
