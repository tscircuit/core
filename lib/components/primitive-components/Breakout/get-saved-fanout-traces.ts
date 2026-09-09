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
      const firstLayer =
        first.route_type === "wire" ? first.layer : first.from_layer
      const portPosition = port._getGlobalPcbPositionAfterLayout()
      if (
        Math.hypot(first.x - portPosition.x, first.y - portPosition.y) > 1e-4 ||
        !port.getAvailablePcbLayers().includes(firstLayer)
      ) {
        throw new Error(
          `Saved fanout path "${path.connection}" must start at its PCB port on an available layer`,
        )
      }
      if (first.route_type === "via" && !input.allowViaInPad) {
        throw new Error(
          `Saved fanout path "${path.connection}" starts with a via at a pad; enable allowViaInPad`,
        )
      }
      const last = route.at(-1)!
      const lastLayer = last.route_type === "wire" ? last.layer : last.to_layer
      const endpoints = [
        { ...first, layer: firstLayer },
        { ...last, layer: lastLayer },
      ]
      if (
        connection.pointsToConnect.some(
          (point) =>
            !endpoints.some(
              (endpoint) =>
                Math.hypot(point.x - endpoint.x, point.y - endpoint.y) < 1e-4 &&
                (point.layers ?? [point.layer]).includes(endpoint.layer),
            ),
        )
      )
        throw new Error(
          `Saved fanout path "${path.connection}" does not cover its connection endpoints`,
        )
      // Explicit wire contacts keep Circuit JSON connectivity checks aware of
      // the pad/exit layer without changing the saved copper or via position.
      const width =
        route.find((point) => point.route_type === "wire")?.width ??
        input.minTraceWidth
      if (first.route_type === "via") {
        route.splice(1, 0, {
          route_type: "wire",
          x: first.x,
          y: first.y,
          layer: first.to_layer,
          width,
        })
        route.unshift({
          route_type: "wire",
          x: first.x,
          y: first.y,
          layer: first.from_layer,
          width,
        })
      }
      if (last.route_type === "via") {
        route.splice(route.length - 1, 0, {
          route_type: "wire",
          x: last.x,
          y: last.y,
          layer: last.from_layer,
          width,
        })
        route.push({
          route_type: "wire",
          x: last.x,
          y: last.y,
          layer: last.to_layer,
          width,
        })
      }
      if (last.route_type === "via") {
        // A coincident wire pair represents the contact on the exit layer for
        // consumers that build connectivity from wire segments.
        route.push({
          route_type: "wire",
          x: last.x,
          y: last.y,
          layer: last.to_layer,
          width,
        })
      }
      coveredConnections.add(connection)
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: `saved_fanout_${breakout.pcb_group_id}_${pathIndex}`,
        connection_name: connection.name,
        source_trace_id: connection.source_trace_id,
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
