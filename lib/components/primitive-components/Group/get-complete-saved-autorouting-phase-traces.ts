import type { fanoutTracePath } from "@tscircuit/props"
import type { z } from "zod"
import { applyToPoint } from "transformation-matrix"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSavedRouteConnectivity } from "lib/utils/autorouting/get-saved-route-connectivity"
import {
  resolveSavedTraceRouteWidths,
  getSavedTraceRouteWithViaContacts,
} from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import {
  getAutoroutedViaLayers,
  getViaBoardLayers,
} from "lib/utils/getViaSpanLayers"
import type { Port } from "../Port"
import type { IGroup } from "./IGroup"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import { getSavedPcbTracePathTransform } from "./get-saved-pcb-trace-path-transform"

/**
 * Replay a complete phase as connected copper, rather than consuming pads in
 * path order. Saved points use the enclosing group's local PCB frame, mm
 * (+X right, +Y up, +Z above; right-handed). Port layout displacement and group
 * placement translate points into board world; physical layers do not change.
 * `connection` identifies the port supplying the frame and electrical net.
 * A path may start at a junction if saved copper connects it to that port.
 */
export function getCompleteSavedAutoroutingPhaseTraces({
  group,
  subcircuit,
  paths,
  phaseIndex,
  input,
}: {
  group: Pick<IGroup, "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout">
  subcircuit: Pick<ISubcircuit, "selectOne" | "selectAll">
  paths: z.output<typeof fanoutTracePath>[]
  phaseIndex?: number | null
  input: SimpleRouteJson
}) {
  const boardLayers = getViaBoardLayers(input.layerCount)
  const savedPorts = new Map<Port, Set<string>>()
  const preparedPaths = paths.map((path) => {
    const port = subcircuit.selectOne(path.connection, {
      type: "port",
    }) as Port | null
    if (!port)
      throw new Error(
        `Saved phase path "${path.connection}" must select a PCB port`,
      )
    const connections = input.connections.filter((connection) =>
      connection.pointsToConnect.some(
        (point) => point.pcb_port_id === port.pcb_port_id,
      ),
    )
    if (!connections.length)
      throw new Error(
        `Saved phase path "${path.connection}" must select a connection in this phase`,
      )
    const transform = getSavedPcbTracePathTransform(group, port)
    const route = resolveSavedTraceRouteWidths(path.route).map((point) => ({
      ...point,
      ...applyToPoint(transform, point),
    }))
    const routeKey = JSON.stringify(route)
    const previousRoutes = savedPorts.get(port) ?? new Set<string>()
    if (previousRoutes.has(routeKey))
      throw new Error(`Duplicate saved phase path for "${path.connection}"`)
    previousRoutes.add(routeKey)
    savedPorts.set(port, previousRoutes)
    for (const point of route) {
      const layers =
        point.route_type === "wire"
          ? [point.layer]
          : [point.from_layer, point.to_layer]
      if (layers.some((layer) => !boardLayers.includes(layer)))
        throw new Error(
          `Saved phase path "${path.connection}" uses a layer unavailable on this board`,
        )
    }
    return { path, port, connection: connections[0]!, route }
  })
  const pcbPorts = (subcircuit.selectAll("port") as Port[]).flatMap((port) => {
    const pcbPort = port.pcb_port_id
      ? port.root!.db.pcb_port.get(port.pcb_port_id)
      : undefined
    return pcbPort ? [pcbPort] : []
  })
  const graph = getSavedRouteConnectivity({
    routes: preparedPaths.map(({ route }) => route),
    input,
    pcbPorts,
  })
  const netByPhysicalComponent = new Map<number, SimpleRouteConnection>()
  for (const [
    routeIndex,
    { path, port, connection, route },
  ] of preparedPaths.entries()) {
    const net = graph.netByConnection.get(connection)!
    const connectedTerminals = graph.connectedTerminals(routeIndex)
    if (
      !connectedTerminals.some(
        (terminal) => terminal.point.pcb_port_id === port.pcb_port_id,
      )
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" must start at its PCB port or join saved copper connected to that port on an available layer`,
      )
    }
    const physicalComponent = graph.routeComponents[routeIndex]!
    const otherNet = netByPhysicalComponent.get(physicalComponent)
    if (
      (otherNet && otherNet !== net) ||
      connectedTerminals.some((terminal) => terminal.net !== net)
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" touches copper belonging to a different net`,
      )
    }
    netByPhysicalComponent.set(physicalComponent, net)
    if (
      !input.allowViaInPad &&
      route.some(
        (point) =>
          point.route_type === "via" &&
          pcbPorts.some(
            (pcbPort) =>
              Math.hypot(point.x - pcbPort.x, point.y - pcbPort.y) < 1e-4 &&
              getAutoroutedViaLayers({
                fromLayer: point.from_layer,
                toLayer: point.to_layer,
                layerCount: input.layerCount,
                allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
              }).some((layer) => pcbPort.layers.includes(layer)),
          ),
      )
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" has a via at a pad; enable allowViaInPad`,
      )
    }
    const first = route[0]!
    const last = route.at(-1)!
    const endpoints = [
      {
        ...first,
        layer: first.route_type === "wire" ? first.layer : first.from_layer,
      },
      {
        ...last,
        layer: last.route_type === "wire" ? last.layer : last.to_layer,
      },
    ]
    const closed =
      Math.hypot(first.x - last.x, first.y - last.y) < 1e-4 &&
      endpoints[0]!.layer === endpoints[1]!.layer
    if (
      !closed &&
      [first, last].some(
        (endpoint) =>
          !(
            endpoint.route_type === "wire"
              ? [endpoint.layer]
              : getAutoroutedViaLayers({
                  fromLayer: endpoint.from_layer,
                  toLayer: endpoint.to_layer,
                  layerCount: input.layerCount,
                  allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
                })
          ).some((layer) =>
            graph.touchesOtherCopper({ ...endpoint, layer }, routeIndex),
          ),
      )
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" must end at another connection endpoint or join same-net saved copper`,
      )
    }
  }
  for (const connection of input.connections) {
    const terminalIndices = graph.terminals.flatMap(
      (terminal, terminalIndex) =>
        terminal.connection === connection ? [terminalIndex] : [],
    )
    const components = terminalIndices.map(
      (terminalIndex) => graph.terminalComponents[terminalIndex]!,
    )
    const label =
      graph.terminals[terminalIndices[0]!]?.point.port_selector ??
      preparedPaths.find(
        (path) =>
          graph.netByConnection.get(path.connection) ===
          graph.netByConnection.get(connection),
      )?.path.connection ??
      "unnamed connection"
    if (
      !components.some((component) => netByPhysicalComponent.has(component))
    ) {
      throw new Error(
        `pcbTracePaths must cover every connection in the phase; missing: ${label}`,
      )
    }
    if (new Set(components).size > 1)
      throw new Error(
        `Saved phase paths for "${label}" must connect every endpoint with copper`,
      )
  }
  const traces: SimplifiedPcbTrace[] = preparedPaths.map(
    ({ route, connection }, pathIndex) => ({
      type: "pcb_trace",
      pcb_trace_id: `saved_phase_${group.pcb_group_id}_${phaseIndex ?? "default"}_${pathIndex}`,
      connection_name: connection.name,
      connectsTo: [
        connection.source_trace_id,
        ...connection.pointsToConnect.map((point) => point.pointId),
      ].filter((id): id is string => Boolean(id)),
      route: getSavedTraceRouteWithViaContacts(route, input.minTraceWidth),
    }),
  )
  return { traces }
}
