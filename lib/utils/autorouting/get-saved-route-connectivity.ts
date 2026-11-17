import {
  pointToSegmentDistance,
  segmentToSegmentMinDistance,
} from "@tscircuit/math-utils"
import type { PcbPort } from "circuit-json"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import Flatbush from "flatbush"
import { getAutoroutedViaLayers } from "../getViaSpanLayers"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"
import type { SavedPcbRoute } from "./resolve-saved-trace-route-widths"

type PcbPortId = PcbPort["pcb_port_id"]
type RoutingNetId = NonNullable<
  ReturnType<ConnectivityMap["getNetConnectedToId"]>
>
type LayerPoint = { x: number; y: number; layer: string }
type RouteSegment = { start: LayerPoint; end: LayerPoint; node: number }

// Match the saved-path endpoint tolerance. Net membership never bridges a gap.
const CONTACT_TOLERANCE = 1e-4

/**
 * Build separate logical-net and physical-route connectivity for one phase.
 * Geometry is board-world mm (+X right, +Y up, +Z above; right-handed).
 * Coordinates are points, not directions. Wires meet at centreline contacts;
 * vias and plated ports join only the copper layers they physically occupy.
 * No route is moved, split, reversed, or joined to satisfy a declared net.
 */
export function getSavedRouteConnectivity({
  routes,
  input,
  pcbPorts,
}: {
  routes: SavedPcbRoute[]
  input: SimpleRouteJson
  pcbPorts: PcbPort[]
}) {
  const portsById = new Map<PcbPortId, PcbPort>(
    pcbPorts.map((port) => [port.pcb_port_id, port]),
  )
  const logicalConnectivity = new ConnectivityMap({})
  logicalConnectivity.addConnections(
    input.connections.map((connection) => [
      `connection:${connection.name}`,
      ...[
        connection.netConnectionName,
        connection.rootConnectionName,
        ...(connection.mergedConnectionNames ?? []),
      ]
        .filter((name) => name !== undefined)
        .map((name) => `connection:${name}`),
      ...connection.pointsToConnect.flatMap((point) => [
        ...(point.pcb_port_id ? [`port:${point.pcb_port_id}`] : []),
        ...(point.pointId ? [`point:${point.pointId}`] : []),
      ]),
    ]),
  )
  const representativeByNet = new Map<RoutingNetId, SimpleRouteConnection>()
  const netByConnection = new Map<
    SimpleRouteConnection,
    SimpleRouteConnection
  >()
  for (const connection of input.connections) {
    const netId = logicalConnectivity.getNetConnectedToId(
      `connection:${connection.name}`,
    )!
    const representative = representativeByNet.get(netId) ?? connection
    representativeByNet.set(netId, representative)
    netByConnection.set(connection, representative)
  }
  const terminals = input.connections.flatMap((connection) =>
    connection.pointsToConnect.map((point) => ({
      point,
      connection,
      net: netByConnection.get(connection)!,
      port: point.pcb_port_id ? portsById.get(point.pcb_port_id) : undefined,
    })),
  )
  const parents = Array.from(
    { length: routes.length + terminals.length },
    (_, node) => node,
  )
  const root = (node: number): number => {
    while (parents[node] !== node) {
      parents[node] = parents[parents[node]!]!
      node = parents[node]!
    }
    return node
  }
  const join = (a: number, b: number) => {
    parents[root(a)] = root(b)
  }
  const segments: RouteSegment[] = []
  for (const [node, route] of routes.entries()) {
    for (const [pointIndex, point] of route.entries()) {
      const layers =
        point.route_type === "wire"
          ? [point.layer]
          : getAutoroutedViaLayers({
              fromLayer: point.from_layer,
              toLayer: point.to_layer,
              layerCount: input.layerCount,
              allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
            })
      for (const layer of layers) {
        const contact = { x: point.x, y: point.y, layer }
        segments.push({ start: contact, end: contact, node })
      }
      const next = route[pointIndex + 1]
      if (!next) continue
      const layer = point.route_type === "wire" ? point.layer : point.to_layer
      const nextLayer =
        next.route_type === "wire" ? next.layer : next.from_layer
      if (layer !== nextLayer)
        throw new Error("Saved phase paths must use vias for layer changes")
      segments.push({
        start: { ...point, layer },
        end: { ...next, layer },
        node,
      })
    }
  }
  for (const [terminalIndex, terminal] of terminals.entries()) {
    for (const layer of terminal.port?.layers ?? [terminal.point.layer]) {
      const contact = { ...terminal.point, layer }
      segments.push({
        start: contact,
        end: contact,
        node: routes.length + terminalIndex,
      })
    }
  }
  const spatialIndex = segments.length
    ? new Flatbush(segments.length)
    : undefined
  const bounds = (segment: RouteSegment) =>
    [
      Math.min(segment.start.x, segment.end.x) - CONTACT_TOLERANCE,
      Math.min(segment.start.y, segment.end.y) - CONTACT_TOLERANCE,
      Math.max(segment.start.x, segment.end.x) + CONTACT_TOLERANCE,
      Math.max(segment.start.y, segment.end.y) + CONTACT_TOLERANCE,
    ] as const
  for (const segment of segments) spatialIndex!.add(...bounds(segment))
  spatialIndex?.finish()
  for (const [segmentIndex, segment] of segments.entries()) {
    for (const candidateIndex of spatialIndex!.search(...bounds(segment))) {
      if (candidateIndex <= segmentIndex) continue
      const candidate = segments[candidateIndex]!
      if (
        root(segment.node) === root(candidate.node) ||
        segment.start.layer !== candidate.start.layer
      )
        continue
      if (
        segmentToSegmentMinDistance(
          segment.start,
          segment.end,
          candidate.start,
          candidate.end,
        ) <= CONTACT_TOLERANCE
      ) {
        join(segment.node, candidate.node)
      }
    }
  }
  const routeComponents = routes.map((_, routeIndex) => root(routeIndex))
  const terminalComponents = terminals.map((_, terminalIndex) =>
    root(routes.length + terminalIndex),
  )
  return {
    terminals,
    routeComponents,
    terminalComponents,
    netByConnection,
    connectedTerminals: (routeIndex: number) =>
      terminals.filter(
        (_, terminalIndex) =>
          terminalComponents[terminalIndex] === routeComponents[routeIndex],
      ),
    touchesOtherCopper: (point: LayerPoint, routeIndex: number) =>
      (
        spatialIndex?.search(
          point.x - CONTACT_TOLERANCE,
          point.y - CONTACT_TOLERANCE,
          point.x + CONTACT_TOLERANCE,
          point.y + CONTACT_TOLERANCE,
        ) ?? []
      ).some((segmentIndex) => {
        const segment = segments[segmentIndex]!
        return (
          segment.node !== routeIndex &&
          segment.start.layer === point.layer &&
          pointToSegmentDistance(point, segment.start, segment.end) <=
            CONTACT_TOLERANCE
        )
      }),
  }
}
