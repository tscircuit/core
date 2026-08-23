import { expect, test } from "bun:test"
import { getObstaclesFromRoute } from "lib/utils/obstacles/getObstaclesFromRoute"

test("getObstaclesFromRoute converts a diagonal routed trace segment into obstacles", () => {
  const source_trace_id = "source_port_130_0"
  const start = { x: -3.0127, y: -11.3044, layer: "top" }
  const end = { x: -2.5425446949529054, y: -11.1644, layer: "top" }

  const obstacles = getObstaclesFromRoute([start, end], source_trace_id)

  expect(obstacles).toEqual([
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      width: Math.abs(end.x - start.x) + 0.1,
      height: Math.abs(end.y - start.y) + 0.1,
      connectedTo: [source_trace_id],
    },
  ])

  const longSegmentObstacles = getObstaclesFromRoute(
    [
      { x: 0, y: 0, layer: "bottom" },
      { x: 1.2, y: 0.6, layer: "bottom" },
    ],
    source_trace_id,
  )

  expect(longSegmentObstacles).toHaveLength(3)
  expect(
    longSegmentObstacles.every(
      (obstacle) => obstacle.width <= 0.500001 && obstacle.height <= 0.300001,
    ),
  ).toBe(true)
})
