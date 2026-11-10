import type { Point, SystemBlockRoutePoint } from "circuit-json"
import type { SystemBlockTree } from "./collect-system-blocks"
import { createSystemBlockSelfLoop } from "./create-system-block-self-loop"
import {
  roundSystemBlockRoute,
  type SystemBlockRouteObstacle,
} from "./round-system-block-route"
import {
  getSystemConnectionLabelWidth,
  SYSTEM_CONNECTION_LABEL_HORIZONTAL_PADDING,
  type SystemBlockBounds,
  type SystemConnectionRoute,
} from "./route-system-blocks"
import type { SystemBlockComponent } from "lib/components/primitive-components/SystemBlockComponent"
import type { SystemBlockConnection } from "lib/components/primitive-components/SystemBlockConnection"
import type { SystemBlockGroup } from "lib/components/primitive-components/SystemBlockGroup"

/**
 * Round optimized wires in page-centered mm (+X right, +Y up, +Z out of page).
 * Endpoints and controls are absolute points. Protect neighboring wire envelopes
 * as well as blocks and labels, so rounding preserves the router's clearances.
 */
export function roundSystemBlockConnections(
  tree: SystemBlockTree,
  bounds: Map<SystemBlockComponent | SystemBlockGroup, SystemBlockBounds>,
  routes: Map<SystemBlockConnection, SystemConnectionRoute>,
): Map<SystemBlockConnection, SystemConnectionRoute> {
  const obstacles: SystemBlockRouteObstacle[] = [...bounds].map(
    ([block, box]) => ({
      minX: box.center.x - box.width / 2,
      maxX: box.center.x + box.width / 2,
      minY: tree.groups.includes(block as SystemBlockGroup)
        ? box.center.y +
          box.height / 2 -
          (block._parsedProps.description ? 12 : 7)
        : box.center.y - box.height / 2,
      maxY: box.center.y + box.height / 2,
    }),
  )
  for (const [connection, resolved] of routes) {
    const label = resolved.label_anchor_center
    if (!label) continue
    // Routing reserves a 3 mm text halo. Let the fillet use that margin while
    // protecting the estimated glyph bounds, so inline text does not pin a
    // corner to a sharp right angle at the halo's edge.
    const halfWidth =
      (getSystemConnectionLabelWidth(connection._parsedProps.label!) -
        SYSTEM_CONNECTION_LABEL_HORIZONTAL_PADDING) /
      2
    obstacles.push({
      minX: label.x - halfWidth,
      maxX: label.x + halfWidth,
      minY: label.y - 2.5,
      maxY: label.y + 2.5,
    })
  }
  const rounded = new Map(routes)
  for (const [connection, resolved] of routes) {
    const wireObstacles: SystemBlockRouteObstacle[] = []
    for (const [other, { route }] of rounded) {
      if (other === connection) continue
      for (let index = 1; index < route.length; index++) {
        const end: SystemBlockRoutePoint = route[index]
        const points: Point[] = [
          route[index - 1],
          ...(end.cubic_bezier_control_points ?? []),
          end,
        ]
        wireObstacles.push({
          minX: Math.min(...points.map((p) => p.x)),
          maxX: Math.max(...points.map((p) => p.x)),
          minY: Math.min(...points.map((p) => p.y)),
          maxY: Math.max(...points.map((p) => p.y)),
        })
      }
    }
    const blocked = [
      ...obstacles,
      ...wireObstacles.map((wire) => ({
        minX: wire.minX - 3,
        maxX: wire.maxX + 3,
        minY: wire.minY - 3,
        maxY: wire.maxY + 3,
      })),
    ]
    const { from, to } = tree.endpoints.get(connection)!
    const selfLoop =
      from === to
        ? createSystemBlockSelfLoop(resolved.route, bounds.get(from)!, blocked)
        : undefined
    rounded.set(connection, {
      ...resolved,
      route:
        selfLoop ??
        roundSystemBlockRoute(resolved.route, obstacles, wireObstacles),
    })
  }
  return rounded
}
