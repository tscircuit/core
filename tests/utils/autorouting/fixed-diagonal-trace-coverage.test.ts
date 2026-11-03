import { expect, test } from "bun:test"
import { pointToSegmentDistance, type Point } from "@tscircuit/math-utils"
import type {
  Obstacle,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

/** Board-world points in mm (+X right, +Y up, +Z above; right-handed).
 * Test membership after the router's obstacle-clearance expansion.
 */
function isPointCovered({
  point,
  obstacles,
  clearance = 0,
}: {
  point: Point
  obstacles: Obstacle[]
  clearance?: number
}): boolean {
  return obstacles.some(
    (obstacle) =>
      Math.abs(point.x - obstacle.center.x) <= obstacle.width / 2 + clearance &&
      Math.abs(point.y - obstacle.center.y) <= obstacle.height / 2 + clearance,
  )
}

test.failing(
  "fixed diagonal obstacles cover copper and end caps without closing an adjacent clearance channel",
  (): void => {
    const start = { x: 0, y: 0 }
    const endpoints = [
      { x: 4, y: 4 },
      { x: -4, y: 4 },
      { x: -4, y: -4 },
      { x: 4, y: -4 },
      { x: 4, y: 0 },
      { x: -4, y: 0 },
      { x: 0, y: 4 },
      { x: 0, y: -4 },
      { x: 4, y: 3 },
    ]
    const inputs: SimpleRouteJson[] = endpoints.map((end) => ({
      layerCount: 2,
      minTraceWidth: 1,
      bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
      obstacles: [],
      connections: [],
      traces: [
        {
          type: "pcb_trace",
          pcb_trace_id: "fixed_data",
          connection_name: "data",
          route: [
            { route_type: "wire", ...start, width: 1, layer: "top" },
            { route_type: "wire", ...end, width: 1, layer: "top" },
          ],
        },
      ],
    }))
    const outputs = inputs.map((input) =>
      withFixedTraces(input, new Set(["fixed_data"])),
    )
    for (const [index, output] of outputs.entries()) {
      const uncoveredCopper: Point[] = []
      for (let x = -4.5; x <= 4.5; x += 0.25) {
        for (let y = -4.5; y <= 4.5; y += 0.25) {
          const point = { x, y }
          if (pointToSegmentDistance(point, start, endpoints[index]!) > 0.5)
            continue
          if (!isPointCovered({ point, obstacles: output.obstacles }))
            uncoveredCopper.push(point)
        }
      }
      expect(uncoveredCopper).toEqual([])
      expect(output.traces).toEqual([])
    }
    // This point is 0.919 mm from the diagonal centerline: outside the 0.5 mm
    // copper radius plus 0.2 mm clearance. Coarse square padding blocks it.
    expect(
      isPointCovered({
        point: { x: 2, y: 0.7 },
        obstacles: outputs[0]!.obstacles,
        clearance: 0.2,
      }),
    ).toBe(false)
  },
)
