import { fanoutTracePath } from "@tscircuit/props"
import type { RootCircuit } from "lib/RootCircuit"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SingleLayerConnectionPoint,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getLogicalConnectionGroups } from "lib/utils/autorouting/get-logical-connection-groups"
import { getRouteConnectivity } from "lib/utils/autorouting/get-route-connectivity"
import {
  getSavedTraceViaContactWidths,
  resolveSavedTraceRouteWidths,
} from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import {
  getAutoroutedViaLayers,
  getViaBoardLayers,
} from "lib/utils/getViaSpanLayers"
import { applyToPoint } from "transformation-matrix"
import type { z } from "zod"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Port } from "../Port"
import type { PrecomputedRoutingResult } from "./GroupRoutingPhasePlan"
import type { IGroup } from "./IGroup"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import {
  getPcbTracePathAnchorPort,
  getSavedPcbTracePathTransform,
} from "./get-saved-pcb-trace-path-transform"

const touchesEndpoint = (
  {
    point,
    endpoint,
  }: {
    point: SingleLayerConnectionPoint
    endpoint: { x: number; y: number; layer: string }
  },
  db: RootCircuit["db"],
) =>
  Math.hypot(point.x - endpoint.x, point.y - endpoint.y) < 1e-4 &&
  (point.pcb_port_id
    ? db.pcb_port
        .get(point.pcb_port_id)!
        .layers.some((layer) => layer === endpoint.layer)
    : point.layer === endpoint.layer)

/**
 * Saved points are local to the phase's enclosing PCB group, in mm (+X right,
 * +Y up, +Z above, right-handed). Convert points, including translation, to
 * board-world coordinates using the group's placement and source port's layout
 * translation. An invalid local anchor is rejected, not snapped to the port.
 * Physical board layers do not change with placement.
 *
 * Fanout entries select a port. Complete non-fanout entries identify their
 * routing connection by name and may contain original segments between
 * internal junctions. A port in that connection anchors the local placement
 * frame. Segments are checked as a connected copper graph before replay.
 * In fanout phases, a free end replaces its source endpoint for the follow-up
 * router. Saved copper is fixed by the phase runner.
 */
export function getSavedAutoroutingPhaseTraces(
  phase: AutoroutingPhase,
  input: SimpleRouteJson,
  isFanout: boolean,
): PrecomputedRoutingResult {
  return getSavedAutoroutingPhaseTracesFromPaths({
    group: phase.getGroup()!,
    subcircuit: phase.getSubcircuit(),
    paths: phase._parsedProps.pcbTracePaths ?? [],
    phaseIndex: phase._parsedProps.phaseIndex,
    input,
    isFanout,
  })
}

type SavedPathOptions = {
  group: Pick<IGroup, "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout">
  subcircuit: Pick<ISubcircuit, "selectOne" | "selectAll">
  paths: z.output<typeof fanoutTracePath>[]
  phaseIndex?: number | null
  input: SimpleRouteJson
  isFanout: boolean
}

const addViaContacts = (
  route: z.output<typeof fanoutTracePath>["route"],
  minTraceWidth: number,
) => {
  const routeWithViaContacts = route.flatMap((point, index): typeof route => {
    if (point.route_type !== "via") return [point]
    const { fromWidth, toWidth } = getSavedTraceViaContactWidths(
      route,
      index,
      minTraceWidth,
    )
    return [
      {
        route_type: "wire",
        x: point.x,
        y: point.y,
        layer: point.from_layer,
        width: fromWidth,
      },
      point,
      {
        route_type: "wire",
        x: point.x,
        y: point.y,
        layer: point.to_layer,
        width: toWidth,
      },
    ]
  })
  const last = route.at(-1)
  if (last?.route_type === "via") {
    const { toWidth } = getSavedTraceViaContactWidths(
      route,
      route.length - 1,
      minTraceWidth,
    )
    routeWithViaContacts.push({
      route_type: "wire",
      x: last.x,
      y: last.y,
      layer: last.to_layer,
      width: toWidth,
    })
  }
  return routeWithViaContacts
}

/** Replay/validate paths in the group's local PCB frame. */
export function getSavedAutoroutingPhaseTracesFromPaths(
  options: SavedPathOptions,
): PrecomputedRoutingResult {
  const usesConnectionNames = options.paths.some((path) =>
    options.input.connections.some(
      (connection) => connection.name === path.connection,
    ),
  )
  return options.isFanout || !usesConnectionNames
    ? getPortAnchoredSavedAutoroutingPhaseTraces(options)
    : getNetworkSavedAutoroutingPhaseTraces(options)
}

const getPortAnchoredSavedAutoroutingPhaseTraces = ({
  group,
  subcircuit,
  paths,
  phaseIndex,
  input,
  isFanout,
}: SavedPathOptions): PrecomputedRoutingResult => {
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

  for (const [pathIndex, path] of paths.entries()) {
    const port = subcircuit.selectOne(path.connection, {
      type: "port",
    }) as Port | null
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
    const transform = getSavedPcbTracePathTransform(group, port)
    const route = resolveSavedTraceRouteWidths(path.route).map((point) => ({
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
      !touchesEndpoint(
        {
          point: remainingPoints[startIndex]!,
          endpoint: { ...first, layer: firstLayer },
        },
        port.root!.db,
      )
    ) {
      throw new Error(
        `Saved phase path "${path.connection}" must start at its PCB port on an available layer`,
      )
    }
    const endIndex = remainingPoints.findIndex(
      (point, index) =>
        index !== startIndex &&
        touchesEndpoint(
          { point, endpoint: { ...last, layer: lastLayer } },
          port.root!.db,
        ),
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
    const pcbTraceId = `saved_phase_${group.pcb_group_id}_${phaseIndex ?? "default"}_${pathIndex}`
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
        pointId: `${pcbTraceId}_exit`,
      }
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
      route: addViaContacts(route, input.minTraceWidth),
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

/**
 * A non-fanout path array may describe a routed network as its original trace
 * segments. Each entry's connection name identifies the owning connection;
 * the first available port in that connection anchors the local placement
 * frame. A segment can begin or end at an internal junction. Older arrays
 * using a port selector remain accepted when that port identifies one phase
 * connection unambiguously.
 */
const getNetworkSavedAutoroutingPhaseTraces = ({
  group,
  subcircuit,
  paths,
  phaseIndex,
  input,
}: SavedPathOptions): PrecomputedRoutingResult => {
  const boardLayers = getViaBoardLayers(input.layerCount)
  const records: {
    pathIndex: number
    connection: SimpleRouteConnection
    route: z.output<typeof fanoutTracePath>["route"]
  }[] = []
  const portsByPcbPortId = new Map(
    (subcircuit.selectAll("port") as Port[])
      .filter((port) => port.pcb_port_id)
      .map((port) => [port.pcb_port_id!, port]),
  )

  for (const [pathIndex, path] of paths.entries()) {
    const namedConnections = input.connections.filter(
      (connection) => connection.name === path.connection,
    )
    if (namedConnections.length > 1)
      throw new Error(
        `Saved phase path "${path.connection}" must identify exactly one connection in this phase`,
      )
    let connection: SimpleRouteConnection
    let port: Port | undefined
    if (namedConnections.length === 1) {
      connection = namedConnections[0]!
      port = getPcbTracePathAnchorPort(connection, portsByPcbPortId)
      if (!port)
        throw new Error(
          `Saved phase path "${path.connection}" has no PCB port to anchor its placement`,
        )
    } else {
      port =
        (subcircuit.selectOne(path.connection, {
          type: "port",
        }) as Port | null) ?? undefined
      if (!port)
        throw new Error(
          `Saved phase path "${path.connection}" must identify a connection or select a PCB port`,
        )
      const matchingConnections = input.connections.filter((candidate) =>
        candidate.pointsToConnect.some(
          (point) => point.pcb_port_id === port?.pcb_port_id,
        ),
      )
      if (matchingConnections.length !== 1)
        throw new Error(
          `Saved phase path "${path.connection}" must select exactly one connection in this phase`,
        )
      connection = matchingConnections[0]!
    }
    const transform = getSavedPcbTracePathTransform(group, port)
    const route = resolveSavedTraceRouteWidths(path.route).map((point) => ({
      ...point,
      ...applyToPoint(transform, point),
    }))
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
    records.push({ pathIndex, connection, route })
  }

  if (records.length === 0 && input.connections.length > 0)
    throw new Error("pcbTracePaths must cover every connection in the phase")

  // Source traces may repeat the same electrical connection or share a PCB
  // port. Treat those source connections as one logical copper network.
  const logicalGroupByConnection = getLogicalConnectionGroups(input.connections)

  const contacts = [...portsByPcbPortId.values()].flatMap((port) => {
    const pcbPort = port.root?.db.pcb_port.get(port.pcb_port_id!)
    return pcbPort
      ? [{ x: pcbPort.x, y: pcbPort.y, layers: pcbPort.layers }]
      : []
  })
  const routeIndicesByGroup = new Map<number, number[]>()
  for (const [routeIndex, record] of records.entries()) {
    const logicalGroup = logicalGroupByConnection.get(record.connection)!
    const routeIndices = routeIndicesByGroup.get(logicalGroup) ?? []
    routeIndices.push(routeIndex)
    routeIndicesByGroup.set(logicalGroup, routeIndices)
  }
  const connectivityByGroup = new Map<
    number,
    {
      routeIndices: number[]
      connectivity: ReturnType<typeof getRouteConnectivity>
    }
  >()
  for (const [logicalGroup, routeIndices] of routeIndicesByGroup) {
    const connectivity = getRouteConnectivity({
      routes: routeIndices.map((routeIndex) => records[routeIndex]!.route),
      layerCount: input.layerCount,
      allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
      contacts,
    })
    connectivityByGroup.set(logicalGroup, { routeIndices, connectivity })
  }

  const getTerminalLayers = (terminal: SingleLayerConnectionPoint) => {
    const port = terminal.pcb_port_id
      ? portsByPcbPortId.get(terminal.pcb_port_id)
      : undefined
    return terminal.pcb_port_id
      ? (port?.root?.db.pcb_port.get(terminal.pcb_port_id)?.layers ?? [
          terminal.layer,
        ])
      : [terminal.layer]
  }
  const connectedIdsByRoute = records.map(() => new Set<string>())
  for (const connection of input.connections) {
    const logicalGroup = logicalGroupByConnection.get(connection)!
    const groupState = connectivityByGroup.get(logicalGroup)
    if (!groupState)
      throw new Error(
        `pcbTracePaths must cover every connection in the phase; missing: ${connection.name}`,
      )
    const { routeIndices, connectivity } = groupState
    if (!input.allowViaInPad) {
      for (const terminal of connection.pointsToConnect) {
        const terminalLayers = getTerminalLayers(terminal)
        for (const routeIndex of routeIndices) {
          for (const point of records[routeIndex]!.route) {
            if (point.route_type !== "via") continue
            const viaLayers = getAutoroutedViaLayers({
              fromLayer: point.from_layer,
              toLayer: point.to_layer,
              layerCount: input.layerCount,
              allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
            })
            if (
              terminalLayers.some((layer) =>
                viaLayers.some((viaLayer) => viaLayer === layer),
              ) &&
              Math.hypot(point.x - terminal.x, point.y - terminal.y) < 1e-4
            )
              throw new Error(
                `Saved phase paths for "${connection.name}" have a via at a pad; enable allowViaInPad`,
              )
          }
        }
      }
    }
    const matchingComponents = connectivity.components.flatMap(
      (localRouteIndices, componentIndex) =>
        connection.pointsToConnect.every((terminal) =>
          localRouteIndices.some((localRouteIndex) =>
            connectivity.routeTouchesPoint(
              localRouteIndex,
              terminal,
              getTerminalLayers(terminal),
            ),
          ),
        )
          ? [componentIndex]
          : [],
    )
    const ownRouteIndices = routeIndices.flatMap(
      (routeIndex, localRouteIndex) =>
        records[routeIndex]!.connection === connection ? [localRouteIndex] : [],
    )
    if (matchingComponents.length !== 1) {
      if (ownRouteIndices.length > 1)
        throw new Error(
          `Saved phase paths for "${connection.name}" contain disconnected segments`,
        )
      throw new Error(
        `Saved phase paths for "${connection.name}" do not reach every connection endpoint`,
      )
    }
    const componentIndex = matchingComponents[0]!
    if (
      ownRouteIndices.some(
        (localRouteIndex) =>
          !connectivity.components[componentIndex]!.includes(localRouteIndex),
      )
    )
      throw new Error(
        `Saved phase paths for "${connection.name}" contain disconnected segments`,
      )
    for (const localRouteIndex of connectivity.components[componentIndex]!) {
      const routeIndex = routeIndices[localRouteIndex]!
      const connectedIds = connectedIdsByRoute[routeIndex]!
      if (connection.source_trace_id)
        connectedIds.add(connection.source_trace_id)
      for (const terminal of connection.pointsToConnect) {
        if (
          terminal.pointId &&
          connectivity.routeTouchesPoint(
            localRouteIndex,
            terminal,
            getTerminalLayers(terminal),
          )
        )
          connectedIds.add(terminal.pointId)
      }
    }
  }

  const traces: SimplifiedPcbTrace[] = records.map((record, routeIndex) => ({
    type: "pcb_trace",
    pcb_trace_id: `saved_phase_${group.pcb_group_id}_${phaseIndex ?? "default"}_${record.pathIndex}`,
    connection_name: record.connection.name,
    connectsTo: [...connectedIdsByRoute[routeIndex]!],
    route: addViaContacts(record.route, input.minTraceWidth),
  }))
  return { traces }
}
