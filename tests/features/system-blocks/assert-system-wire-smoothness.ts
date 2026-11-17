import { expect } from "bun:test"
import type { SystemBlockConnection } from "circuit-json"

/**
 * Independently check emitted wires (page-centered mm, +X right, +Y up) for
 * kinks: every bend is a quarter-circle fillet of at least `minRadius`, and no
 * wire needs more than `maxBends` of them to reach the other block.
 */
export function assertSystemWireSmoothness(
  connections: SystemBlockConnection[],
  { minRadius, maxBends }: { minRadius: number; maxBends: number },
) {
  for (const connection of connections) {
    if (
      connection.from_system_block_component_id ===
      connection.to_system_block_component_id
    )
      continue
    const { route } = connection
    let bends = 0
    for (let index = 1; index < route.length; index++) {
      const start = route[index - 1]
      const end = route[index]
      const controls = end.cubic_bezier_control_points
      if (controls) {
        bends++
        // A quarter circle's chord is its radius times the square root of two.
        const radius = Math.hypot(end.x - start.x, end.y - start.y) / Math.SQRT2
        expect(radius).toBeGreaterThanOrEqual(minRadius - 1e-6)
        continue
      }
      const next = route[index + 1]
      if (!next || next.cubic_bezier_control_points) continue
      // Two straight pieces in a row must be collinear, never an angular corner.
      expect(
        (end.x - start.x) * (next.y - end.y) -
          (end.y - start.y) * (next.x - end.x),
      ).toBeCloseTo(0, 6)
    }
    expect(bends).toBeLessThanOrEqual(maxBends)
  }
}
