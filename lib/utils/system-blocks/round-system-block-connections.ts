import type { Point, SystemBlockRoutePoint } from "circuit-json"
import type { SystemBlockTree } from "./collect-system-blocks"
import { createSystemBlockSelfLoop } from "./create-system-block-self-loop"
import {
  roundSystemBlockRoute,
  type SystemBlockRouteObstacle,
} from "./round-system-block-route"
import {
  getSystemConnectionLabelWidth,
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
    const halfWidth =
      getSystemConnectionLabelWidth(connection._parsedProps.label!) / 2
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
          minX: Math.min(...points.map((p) => p.x)) - 3,
          maxX: Math.max(...points.map((p) => p.x)) + 3,
          minY: Math.min(...points.map((p) => p.y)) - 3,
          maxY: Math.max(...points.map((p) => p.y)) + 3,
        })
      }
    }
    const blocked = [...obstacles, ...wireObstacles]
    const { from, to } = tree.endpoints.get(connection)!
    const selfLoop =
      from === to
        ? createSystemBlockSelfLoop(resolved.route, bounds.get(from)!, blocked)
        : undefined
    rounded.set(connection, {
      ...resolved,
      route: selfLoop ?? roundSystemBlockRoute(resolved.route, blocked),
    })
  }
  return rounded
}
