import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { applyToPoint, compose, translate } from "transformation-matrix"
import type {
  SimpleRouteJson,
  SimpleRouteConnection,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { Breakout } from "./Breakout"
import { SavedFanoutPoint } from "./SavedFanoutPoint"

/**
 * Convert saved fanout-local points to board-world points in mm (+X right,
 * +Y up, +Z above, right-handed). The exit's actual layout position supplies
 * translation; its primitive transform supplies rotation and reflection.
 * Layers are physical board layers and are preserved.
 */
export function getSavedFanoutTraces(
  breakout: Breakout,
  input: SimpleRouteJson,
): SimplifiedPcbTrace[] {
  const { db } = breakout.root!
  const boardLayers = getViaBoardLayers(input.layerCount)
  const coveredConnections = new Set<SimpleRouteConnection>()
  const exits = breakout.children.filter(
    (child) => child instanceof SavedFanoutPoint,
  )
  const traces = (breakout._parsedProps.pcbTracePaths ?? []).map(
    (path, pathIndex) => {
      for (const point of path.route) {
        const layers =
          point.route_type === "wire"
            ? [point.layer]
            : [point.from_layer, point.to_layer]
        if (layers.some((layer) => !boardLayers.includes(layer))) {
          throw new Error(
            `Saved fanout path "${path.connection}" uses a layer unavailable on this board`,
          )
        }
      }
      const exit = exits[pathIndex]!
      const port = exit.matchedPort!
      const connection = input.connections.find((connection) =>
        connection.pointsToConnect.some(
          (point) => point.pcb_port_id === port.pcb_port_id,
        ),
      )
      if (!connection)
        throw new Error(
          `No fanout connection for saved path "${path.connection}"`,
        )
      const pcbExit = db.pcb_breakout_point.get(exit.pcb_breakout_point_id!)!
      const localExit = path.route.at(-1)!
      // PrimitiveComponent._computePcbGlobalTransformBeforeLayout composes the
      // parent transform, any footprint reflection, and the point's placement.
      const transform = compose(
        exit._computePcbGlobalTransformBeforeLayout(),
        translate(-localExit.x, -localExit.y),
      )
      const originalExit = applyToPoint(transform, localExit)
      const route = path.route.map((point) => {
        const position = applyToPoint(transform, point)
        return {
          ...point,
          x: position.x + pcbExit.x - originalExit.x,
          y: position.y + pcbExit.y - originalExit.y,
        }
      })
      const first = route[0]!
      const portPosition = port._getGlobalPcbPositionAfterLayout()
      if (
        Math.hypot(first.x - portPosition.x, first.y - portPosition.y) > 1e-4 ||
        first.route_type !== "wire" ||
        !port.getAvailablePcbLayers().includes(first.layer)
      ) {
        throw new Error(
          `Saved fanout path "${path.connection}" must start at its PCB port on an available layer`,
        )
      }
      const last = route.at(-1)!
      const endpoints = [first, last]
      if (
        connection.pointsToConnect.some(
          (point) =>
            !endpoints.some(
              (endpoint) =>
                endpoint.route_type === "wire" &&
                Math.hypot(point.x - endpoint.x, point.y - endpoint.y) < 1e-4 &&
                (point.layers ?? [point.layer]).includes(endpoint.layer),
            ),
        )
      )
        throw new Error(
          `Saved fanout path "${path.connection}" does not cover its connection endpoints`,
        )
      coveredConnections.add(connection)
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `saved_fanout_${breakout.pcb_group_id}_${pathIndex}`,
        connection_name: connection.name,
        connectsTo: [
          connection.source_trace_id,
          ...connection.pointsToConnect.map((point) => point.pointId),
        ].filter((id): id is string => Boolean(id)),
        route,
      }
    },
  )
  const missing = input.connections.filter(
    (connection) => !coveredConnections.has(connection),
  )
  if (missing.length)
    throw new Error(
      `pcbTracePaths must cover every fanout connection; missing: ${missing.map((connection) => connection.name).join(", ")}`,
    )
  return traces
}
