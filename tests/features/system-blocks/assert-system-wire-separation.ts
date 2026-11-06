import { expect } from "bun:test"
import Flatten from "@flatten-js/core"
import type { SystemBlockConnection } from "circuit-json"

/** Independently check emitted wires in page-centered mm (+X right, +Y up). */
export function assertSystemWireSeparation(
  connections: SystemBlockConnection[],
) {
  const wires = connections.map((connection) =>
    connection.route
      .slice(1)
      .map(
        (point, index) =>
          new Flatten.Segment(
            new Flatten.Point(
              connection.route[index].x,
              connection.route[index].y,
            ),
            new Flatten.Point(point.x, point.y),
          ),
      ),
  )
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
          if (horizontal !== secondHorizontal) continue
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
