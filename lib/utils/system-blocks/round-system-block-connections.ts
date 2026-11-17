import type { Point, SystemBlockRoutePoint } from "circuit-json"
import type { SystemBlockTree } from "./collect-system-blocks"
import { createSystemBlockSelfLoop } from "./create-system-block-self-loop"
import {
  limitSystemWireFillets,
  sampleSystemBlockRoute,
} from "./limit-system-wire-fillets"
import {
  resolveSystemBlockRouteTrims,
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
    ([block, box]) => {
      const group = tree.groups.includes(block as SystemBlockGroup)
      return {
        minX: box.center.x - box.width / 2,
        // Like the router, protect a group's heading text, not the whole band
        // beside it: a wire that turns there should still get its fillet.
        maxX:
          group && !block._parsedProps.description
            ? box.center.x -
              box.width / 2 +
              Math.min(
                box.width,
                (block._parsedProps.displayName ?? block.name).length * 1.8 + 6,
              )
            : box.center.x + box.width / 2,
        minY: group
          ? box.center.y +
            box.height / 2 -
            (block._parsedProps.description ? 12 : 7)
          : box.center.y - box.height / 2,
        maxY: box.center.y + box.height / 2,
      }
    },
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
  const wires: {
    connection: SystemBlockConnection
    route: Point[]
    trims: number[]
  }[] = []
  const loops: Point[][] = []
  for (const [connection, resolved] of routes) {
    const { from, to } = tree.endpoints.get(connection)!
    if (from !== to) {
      wires.push({
        connection,
        ...(({ points, trims }) => ({ route: points, trims }))(
          resolveSystemBlockRouteTrims(resolved.route, obstacles),
        ),
      })
      continue
    }
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
    const loop =
      createSystemBlockSelfLoop(resolved.route, bounds.get(from)!, blocked) ??
      roundSystemBlockRoute(resolved.route, obstacles, wireObstacles)
    rounded.set(connection, { ...resolved, route: loop })
    loops.push(sampleSystemBlockRoute(loop))
  }
  // Blocks and labels bound each fillet on its own. Wires bound one another
  // only as rounded shapes, so parallel wires can turn a corner side by side.
  limitSystemWireFillets(wires, loops)
  for (const { connection, route, trims } of wires)
    rounded.set(connection, {
      ...routes.get(connection)!,
      route: roundSystemBlockRoute(route, [], [], trims),
    })
  return rounded
}
