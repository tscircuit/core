import { expect } from "bun:test"
import Flatten from "@flatten-js/core"
import type { SystemBlockConnection } from "circuit-json"

/** Independently check emitted wires in page-centered mm (+X right, +Y up). */
export function assertSystemWireSeparation(
  connections: SystemBlockConnection[],
) {
  const wires = connections.map((connection) => {
    // Sample emitted cubic segments independently of the router and rounding
    // code. Chords between only their endpoints can miss a curved intersection.
    const sampled = [connection.route[0]]
    for (let index = 1; index < connection.route.length; index++) {
      const end = connection.route[index]
      const controls = end.cubic_bezier_control_points
      if (!controls) {
        sampled.push(end)
        continue
      }
      const start = connection.route[index - 1]
      const [a, b] = controls
      for (let step = 1; step <= 32; step++) {
        const t = step / 32,
          s = 1 - t
        sampled.push({
          x:
            s ** 3 * start.x +
            3 * s * s * t * a.x +
            3 * s * t * t * b.x +
            t ** 3 * end.x,
          y:
            s ** 3 * start.y +
            3 * s * s * t * a.y +
            3 * s * t * t * b.y +
            t ** 3 * end.y,
        })
      }
    }
    return sampled
      .slice(1)
      .map(
        (point, index) =>
          new Flatten.Segment(
            new Flatten.Point(sampled[index].x, sampled[index].y),
            new Flatten.Point(point.x, point.y),
          ),
      )
  })
  for (let i = 0; i < wires.length; i++)
    for (let j = i + 1; j < wires.length; j++) {
      for (const first of wires[i])
        for (const second of wires[j]) {
          // Includes crossings at bends and collinear overlap, not just intersections
          // of the open interiors. Separate connections must not appear joined.
          expect(first.intersect(second)).toHaveLength(0)
          const horizontal = Math.abs(first.start.y - first.end.y) < 1e-6
          const secondHorizontal =
            Math.abs(second.start.y - second.end.y) < 1e-6
          const vertical = Math.abs(first.start.x - first.end.x) < 1e-6
          const secondVertical = Math.abs(second.start.x - second.end.x) < 1e-6
          if (
            !((horizontal && secondHorizontal) || (vertical && secondVertical))
          )
            continue
          const firstBox = first.box,
            secondBox = second.box
          const overlap = horizontal
            ? Math.min(firstBox.xmax, secondBox.xmax) -
              Math.max(firstBox.xmin, secondBox.xmin)
            : Math.min(firstBox.ymax, secondBox.ymax) -
              Math.max(firstBox.ymin, secondBox.ymin)
          if (overlap <= 1e-6) continue
          expect(first.distanceTo(second)[0]).toBeGreaterThanOrEqual(3 - 1e-6)
        }
    }
}
