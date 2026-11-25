import {
  pointToSegmentDistance,
  segmentToSegmentMinDistance,
} from "@tscircuit/math-utils"
import type { PcbPort, Point } from "circuit-json"
import Flatbush from "flatbush"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"
import type { SavedPcbTracePath } from "./get-saved-pcb-trace-path-transform"

type BoardStack = Pick<
  SimpleRouteJson,
  "layerCount" | "allowBlindAndBuriedVias"
>
type SavedRoute = SavedPcbTracePath["route"]
type CopperContact = Point & { layers: readonly string[] }
type CopperSegment = { start: Point; end: Point; layer: string; node: number }

export const SAVED_ROUTE_CONTACT_TOLERANCE = 1e-4

export function getSavedRoutePointLayers(
  point: SavedRoute[number],
  board: BoardStack,
) {
  return point.route_type === "wire"
    ? [point.layer]
    : getAutoroutedViaLayers({
        fromLayer: point.from_layer,
        toLayer: point.to_layer,
        layerCount: board.layerCount,
        allowBlindAndBuriedVias: board.allowBlindAndBuriedVias,
      })
}

export function getSavedPhaseRouteContacts(
  routes: readonly SavedRoute[],
  input: SimpleRouteJson,
  getPcbPort: (id: PcbPort["pcb_port_id"]) => PcbPort | null | undefined,
) {
  const terminals = input.connections.flatMap((connection) =>
    connection.pointsToConnect.map((point) => ({
      connection,
      point,
      x: point.x,
      y: point.y,
      layers: (point.pcb_port_id && getPcbPort(point.pcb_port_id)?.layers) || [
        point.layer,
      ],
    })),
  )
  // These groups are already connected inside components or through retained
  // board copper. Net membership alone must never join disconnected terminals.
  const connectedTerminalGroups = input.connections.flatMap((connection) =>
    (connection.externallyConnectedPointIds ?? []).map((pointIds) => {
      const connectedPointIds = new Set(pointIds)
      return terminals.flatMap(({ point }, index) =>
        point.pointId && connectedPointIds.has(point.pointId) ? [index] : [],
      )
    }),
  )
  const contacts = getSavedRouteContacts(
    routes,
    terminals,
    input,
    connectedTerminalGroups,
  )
  const terminalsByComponent = new Map<number, (typeof terminals)[number][]>()
  const componentsByConnection = new Map<SimpleRouteConnection, Set<number>>()
  for (const [index, terminal] of terminals.entries()) {
    const component = contacts.terminalComponents[index]!
    const connectedTerminals = terminalsByComponent.get(component) ?? []
    connectedTerminals.push(terminal)
    terminalsByComponent.set(component, connectedTerminals)
    const components =
      componentsByConnection.get(terminal.connection) ?? new Set()
    components.add(component)
    componentsByConnection.set(terminal.connection, components)
  }
  return {
    routeComponents: contacts.routeComponents,
    isEndpointConnected: contacts.isEndpointConnected,
    componentsByConnection,
    getRouteTerminals(routeIndex: number) {
      return (
        terminalsByComponent.get(contacts.routeComponents[routeIndex]!) ?? []
      )
    },
  }
}

/**
 * Find physical contacts in board-world mm (+X right, +Y up, +Z above).
 * Each route is already continuous through its declared layer transitions.
 * Wires touch on a shared layer at their centrelines; vias and plated ports
 * join the layers they occupy. Connected terminal groups contain terminal
 * indices for existing electrical links; they do not create geometric contacts.
 */
export function getSavedRouteContacts(
  routes: readonly SavedRoute[],
  terminals: readonly CopperContact[],
  board: BoardStack,
  connectedTerminalGroups: readonly (readonly number[])[] = [],
) {
  const segments: CopperSegment[] = []
  for (const [node, route] of routes.entries()) {
    for (const [index, point] of route.entries()) {
      if (point.route_type === "via") {
        for (const layer of getSavedRoutePointLayers(point, board)) {
          segments.push({ start: point, end: point, layer, node })
        }
      }
      const next = route[index + 1]
      if (next) {
        const layer = point.route_type === "wire" ? point.layer : point.to_layer
        segments.push({ start: point, end: next, layer, node })
      }
    }
  }
  for (const [index, point] of terminals.entries()) {
    for (const layer of point.layers) {
      segments.push({
        start: point,
        end: point,
        layer,
        node: routes.length + index,
      })
    }
  }

  const tolerance = SAVED_ROUTE_CONTACT_TOLERANCE
  const bounds = (start: Point, end: Point) =>
    [
      Math.min(start.x, end.x) - tolerance,
      Math.min(start.y, end.y) - tolerance,
      Math.max(start.x, end.x) + tolerance,
      Math.max(start.y, end.y) + tolerance,
    ] as const
  const index = segments.length > 0 ? new Flatbush(segments.length) : null
  if (index) {
    for (const { start, end } of segments) index.add(...bounds(start, end))
    index.finish()
  }

  const parents = Array.from(
    { length: routes.length + terminals.length },
    (_, node) => node,
  )
  const component = (node: number) => {
    while (parents[node] !== node) {
      parents[node] = parents[parents[node]!]!
      node = parents[node]!
    }
    return node
  }
  for (const group of connectedTerminalGroups) {
    const first = group[0]
    if (first === undefined) continue
    for (const terminalIndex of group.slice(1)) {
      parents[component(routes.length + terminalIndex)] = component(
        routes.length + first,
      )
    }
  }
  for (const [
    segmentIndex,
    { start, end, layer, node },
  ] of segments.entries()) {
    for (const candidateIndex of index!.search(...bounds(start, end))) {
      if (candidateIndex <= segmentIndex) continue
      const candidate = segments[candidateIndex]!
      if (candidate.layer !== layer) continue
      const a = component(node)
      const b = component(candidate.node)
      if (
        a !== b &&
        segmentToSegmentMinDistance(
          start,
          end,
          candidate.start,
          candidate.end,
        ) <= tolerance
      ) {
        parents[a] = b
      }
    }
  }

  return {
    routeComponents: routes.map((_, index) => component(index)),
    terminalComponents: terminals.map((_, index) =>
      component(routes.length + index),
    ),
    isEndpointConnected(routeIndex: number, point: SavedRoute[number]) {
      const layers: readonly string[] = getSavedRoutePointLayers(point, board)
      return (index?.search(...bounds(point, point)) ?? []).some((i) => {
        const { start, end, layer, node } = segments[i]!
        return (
          node !== routeIndex &&
          layers.includes(layer) &&
          pointToSegmentDistance(point, start, end) <= tolerance
        )
      })
    },
  }
}
