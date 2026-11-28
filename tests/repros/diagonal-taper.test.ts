import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("diagonal obstacles enclose the full outgoing copper taper", () => {
  for (const [startWidth, endWidth] of [
    [0.2, 1],
    [1, 0.2],
  ]) {
    const [obstacle] = getObstaclesFromCircuitJson([
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed",
        route: [
          {
            route_type: "wire",
            layer: "top",
            x: 0,
            y: 0,
            width: 0.2,
            start_width: startWidth,
            end_width: endWidth,
            width_interpolation_mode: "linear",
          },
          { route_type: "wire", layer: "top", x: 2, y: 2, width: 0.2 },
        ],
      },
    ])
    expect(obstacle!.ccwRotationDegrees).toBeCloseTo(45)
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const copperWidth = startWidth + (endWidth - startWidth) * t
      expect(obstacle!.height).toBeGreaterThanOrEqual(copperWidth)
    }
    expect(obstacle!.width).toBeCloseTo(Math.hypot(2, 2) + 1)
  }
})
