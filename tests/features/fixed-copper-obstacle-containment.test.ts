import { expect, test } from "bun:test"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("compact fixed obstacles contain diagonal wire copper and both round end caps", () => {
  for (const degrees of [-135, -45, 0, 45, 90, 135]) {
    const angle = (degrees * Math.PI) / 180
    const start = { x: 1.2, y: -3.4 },
      end = {
        x: start.x + 2.3 * Math.cos(angle),
        y: start.y + 2.3 * Math.sin(angle),
      }
    const input: SimpleRouteJson = {
      bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
      layerCount: 4,
      minTraceWidth: 0.1,
      connections: [],
      obstacles: [],
      traces: [
        {
          type: "pcb_trace",
          pcb_trace_id: "fixed",
          connection_name: "net",
          route: [
            { ...start, route_type: "wire", width: 0.1, layer: "top" },
            { ...end, route_type: "wire", width: 0.1, layer: "top" },
          ],
        },
      ],
    }
    const before = JSON.stringify(input)
    const output = withFixedTraces(input, new Set(["fixed"]), {
      useOrientedWireObstacles: true,
    })
    expect(output.traces).toHaveLength(0)
    expect(output.obstacles).toHaveLength(1)
    const obstacle = output.obstacles[0]!,
      rotation = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
    for (const center of [start, end])
      for (let i = 0; i < 32; i++) {
        const point = {
          x: center.x + 0.05 * Math.cos((i * Math.PI) / 16),
          y: center.y + 0.05 * Math.sin((i * Math.PI) / 16),
        }
        const dx = point.x - obstacle.center.x,
          dy = point.y - obstacle.center.y
        expect(
          Math.abs(dx * Math.cos(rotation) + dy * Math.sin(rotation)),
        ).toBeLessThanOrEqual(obstacle.width / 2 + 1e-10)
        expect(
          Math.abs(-dx * Math.sin(rotation) + dy * Math.cos(rotation)),
        ).toBeLessThanOrEqual(obstacle.height / 2 + 1e-10)
      }
    expect(JSON.stringify(input)).toBe(before)
  }
})
