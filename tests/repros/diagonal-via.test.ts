import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("diagonal copper leaving a via occupies its outgoing layer", () => {
  const obstacles = getObstaclesFromCircuitJson([
    {
      type: "pcb_trace",
      pcb_trace_id: "fixed",
      route: [
        { route_type: "wire", layer: "top", x: -1, y: -1, width: 0.3 },
        {
          route_type: "via",
          from_layer: "top",
          to_layer: "bottom",
          x: 0,
          y: 0,
          outer_diameter: 0.65,
        },
        { route_type: "wire", layer: "bottom", x: 1, y: 1, width: 0.3 },
      ],
    },
  ])
  expect(obstacles.map(({ layers }) => layers)).toEqual([
    ["top"],
    ["top", "bottom"],
    ["bottom"],
  ])
  expect(obstacles[1]!.width).toBe(0.65)
})
