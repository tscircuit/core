import { applyToPoint, compose, translate } from "transformation-matrix"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimpleRoutePoint,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Port } from "../Port"
import type { PrecomputedRoutingResult } from "./GroupRoutingPhasePlan"

const touchesEndpoint = (
  point: SimpleRoutePoint,
  endpoint: { x: number; y: number; layer: string },
) =>
  Math.hypot(point.x - endpoint.x, point.y - endpoint.y) < 1e-4 &&
  (point.layers ?? [point.layer]).includes(endpoint.layer)

/**
 * Saved points are local to the phase's enclosing PCB group, in mm (+X right,
 * +Y up, +Z above, right-handed). Convert points, including translation, to
 * board-world coordinates using the group's placement and source port's layout
 * translation. An invalid local anchor is rejected, not snapped to the port.
 * Physical board layers do not change with placement.
 *
 * Each connection selects a port, as with fanout pcbTracePaths. Complete paths
 * join connection endpoints. In fanout phases, a free end replaces its source
 * endpoint for the follow-up router. Saved copper is fixed by the phase runner.
 */
export function getSavedAutoroutingPhaseTraces(
  phase: AutoroutingPhase,
  input: SimpleRouteJson,
  isFanout: boolean,
): PrecomputedRoutingResult {
  const group = phase.getGroup()!
  const transformBeforeLayout = group._computePcbGlobalTransformBeforeLayout()
  const boardLayers = getViaBoardLayers(input.layerCount)
  const remainingPointsByConnection = new Map(
    input.connections.map((connection) => [
      connection,
      [...connection.pointsToConnect],
    ]),
  )
  const coveredConnections = new Set<SimpleRouteConnection>()
  const savedPorts = new Set<Port>()
  const traces: SimplifiedPcbTrace[] = []

  for (const [pathIndex, path] of (
    phase._parsedProps.pcbTracePaths ?? []
  ).entries()) {
    const port = phase
      .getSubcircuit()
      .selectOne(path.connection, { type: "port" }) as Port | null
    if (!port)
      throw new Error(
        `Saved phase path "${path.connection}" must select a PCB port`,
      )
    if (savedPorts.has(port))
      throw new Error(`Duplicate saved phase path for "${path.connection}"`)
    savedPorts.add(port)
    const connections = input.connections.filter((connection) =>
      connection.pointsToConnect.some(
        (point) => point.pcb_port_id === port.pcb_port_id,
      ),
    )
    if (connections.length !== 1) {
      throw new Error(
        `Saved phase path "${path.connection}" must select exactly one connection in this phase`,
      )
    }
    const connection = connections[0]!
    const remainingPoints = remainingPointsByConnection.get(connection)!
    const startIndex = remainingPoints.findIndex(
      (point) => point.pcb_port_id === port.pcb_port_id,
    )
    if (startIndex < 0)
      throw new Error(
        `Saved phase path "${path.connection}" starts at an endpoint already joined by another path`,
      )
    // Port._getGlobalPcbPositionBeforeLayout uses its matched PCB primitive's
    // transform. Compare that independent anchor with the emitted port, rather
    // than pcb_group.center (which is a bounding-box center, not the origin).
    const portBeforeLayout = port._getGlobalPcbPositionBeforeLayout()
    const portAfterLayout = port._getGlobalPcbPositionAfterLayout()
    const transform = compose(
      translate(
        portAfterLayout.x - portBeforeLayout.x,
        portAfterLayout.y - portBeforeLayout.y,
      ),
      transformBeforeLayout,
    )
    const route = path.route.map((point) => ({
      ...point,
      ...applyToPoint(transform, point),
    }))
    for (const point of route) {
      const layers =
        point.route_type === "wire"
          ? [point.layer]
          : [point.from_layer, point.to_layer]
      if (layers.some((layer) => !boardLayers.includes(layer))) {
        throw new Error(
          `Saved phase path "${path.connection}" uses a layer unavailable on this board`,
        )
      }
    }
    const first = route[0]!
    const last = route.at(-1)!
    const firstLayer =
      first.route_type === "wire" ? first.layer : first.from_layer
    const lastLayer = last.route_type === "wire" ? last.layer : last.to_layer
    if (
      !touchesEndpoint(remainingPoints[startIndex]!, {
        ...first,
        layer: firstLayer,
      })
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" must start at its PCB port on an available layer`,
      )
    }
    const endIndex = remainingPoints.findIndex(
      (point, index) =>
        index !== startIndex &&
        touchesEndpoint(point, { ...last, layer: lastLayer }),
    )
    if (
      !input.allowViaInPad &&
      (first.route_type === "via" ||
        (last.route_type === "via" && endIndex >= 0))
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" has a via at a pad; enable allowViaInPad`,
      )
    }
    const pcbTraceId = `saved_phase_${group.pcb_group_id}_${phase._parsedProps.phaseIndex ?? "default"}_${pathIndex}`
    if (endIndex < 0 && !isFanout) {
      throw new Error(
        `Saved phase path "${path.connection}" must end at another connection endpoint; use autorouter="fanout" for saved escapes`,
      )
    }
    if (endIndex >= 0) {
      remainingPoints.splice(startIndex, 1)
    } else {
      remainingPoints[startIndex] = {
        x: last.x,
        y: last.y,
        layer: lastLayer,
        layers: [lastLayer],
        pointId: `${pcbTraceId}_exit`,
      }
    }
    // Explicit wire contacts expose via connectivity to Circuit JSON consumers
    // without moving any saved copper. Interior vias need contacts too.
    const width =
      route.find((point) => point.route_type === "wire")?.width ??
      input.minTraceWidth
    const routeWithViaContacts = route.flatMap((point): typeof route =>
      point.route_type === "via"
        ? [
            {
              route_type: "wire",
              x: point.x,
              y: point.y,
              layer: point.from_layer,
              width,
            },
            point,
            {
              route_type: "wire",
              x: point.x,
              y: point.y,
              layer: point.to_layer,
              width,
            },
          ]
        : [point],
    )
    if (last.route_type === "via") {
      routeWithViaContacts.push({
        route_type: "wire",
        x: last.x,
        y: last.y,
        layer: last.to_layer,
        width,
      })
    }
    coveredConnections.add(connection)
    traces.push({
      type: "pcb_trace",
      pcb_trace_id: pcbTraceId,
      connection_name: connection.name,
      connectsTo: [
        connection.source_trace_id,
        ...connection.pointsToConnect.map((point) => point.pointId),
      ].filter((id): id is string => Boolean(id)),
      route: routeWithViaContacts,
    })
  }
  for (const connection of input.connections) {
    if (!coveredConnections.has(connection)) {
      throw new Error(
        `pcbTracePaths must cover every connection in the phase; missing: ${connection.name}`,
      )
    }
    if (!isFanout && remainingPointsByConnection.get(connection)!.length > 1) {
      throw new Error(
        `Saved phase paths for "${connection.name}" must connect every endpoint; use autorouter="fanout" for saved escapes`,
      )
    }
  }
  const remainingConnections = input.connections.flatMap((connection) => {
    const pointsToConnect = remainingPointsByConnection.get(connection)!
    return pointsToConnect.length > 1
      ? [{ ...connection, pointsToConnect }]
      : []
  })
  const remainingConnectionNames = new Set(
    remainingConnections.map((connection) => connection.name),
  )
  return {
    traces,
    outputSimpleRouteJson: isFanout
      ? {
          ...input,
          connections: remainingConnections,
          buses: input.buses
            ?.map((bus) => ({
              ...bus,
              connectionNames: bus.connectionNames.filter((name) =>
                remainingConnectionNames.has(name),
              ),
            }))
            .filter((bus) => bus.connectionNames.length > 0),
          differentialPairs: input.differentialPairs?.filter((pair) =>
            pair.connectionNames.every((name) =>
              remainingConnectionNames.has(name),
            ),
          ),
          traces: [...(input.traces ?? []), ...traces],
        }
      : undefined,
  }
}
