import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getSavedTraceViaContactWidths } from "lib/utils/autorouting/resolve-saved-trace-route-widths"
import type { IGroup } from "./IGroup"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import {
  getSavedPcbRouteInBoardFrame,
  type SavedPcbTracePath,
} from "./get-saved-pcb-trace-path-transform"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
  SingleLayerConnectionPoint,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Port } from "../Port"
import type { PrecomputedRoutingResult } from "./GroupRoutingPhasePlan"
import type { RootCircuit } from "lib/RootCircuit"
import {
  getSavedPhaseRouteContacts,
  getSavedRoutePointLayers,
  SAVED_ROUTE_CONTACT_TOLERANCE,
} from "./get-saved-route-contacts"
import { getSourceTraceIdForRoutedTrace } from "./get-source-trace-id-for-routed-trace"

type PreparedSavedPath = {
  selector: SavedPcbTracePath["connection"]
  port: Port
  route: SavedPcbTracePath["route"]
}

type SavedPhasePaths = {
  group: Pick<IGroup, "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout">
  subcircuit: Pick<ISubcircuit, "selectOne">
  paths: SavedPcbTracePath[]
  input: SimpleRouteJson
}

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
 * Each connection selects the port supplying the coordinate frame. Complete
 * phases may share pads and join other saved paths. In fanout phases, a free
 * end replaces its source endpoint for the follow-up router.
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

function prepareSavedPaths({
  group,
  subcircuit,
  paths,
  input,
}: SavedPhasePaths): PreparedSavedPath[] {
  const boardLayers = getViaBoardLayers(input.layerCount)
  return paths.map(({ connection: selector, route }) => {
    const port = subcircuit.selectOne<Port>(selector, { type: "port" })
    if (!port?.pcb_port_id)
      throw new Error(`Saved phase path "${selector}" must select a PCB port`)
    for (const point of route) {
      const layers =
        point.route_type === "wire"
          ? [point.layer]
          : [point.from_layer, point.to_layer]
      if (layers.some((layer) => !boardLayers.includes(layer))) {
        throw new Error(
          `Saved phase path "${selector}" uses a layer unavailable on this board`,
        )
      }
    }
    return {
      selector,
      port,
      route: getSavedPcbRouteInBoardFrame(group, port, route),
    }
  })
}

/** Replay paths in the group's local PCB frame; see the public wrapper above. */
export function getSavedAutoroutingPhaseTracesFromPaths({
  phaseIndex,
  isFanout,
  ...savedPhase
}: SavedPhasePaths & {
  phaseIndex?: number | null
  isFanout: boolean
}): PrecomputedRoutingResult {
  const { group, input } = savedPhase
  const traceIdPrefix = `saved_phase_${group.pcb_group_id}_${phaseIndex ?? "default"}`
  if (!isFanout)
    return {
      traces: getValidatedCompleteSavedPaths(savedPhase).map(
        ({ port, route, connection }, routeIndex) => {
          const trace = makeSavedTrace(
            `${traceIdPrefix}_${routeIndex}`,
            connection,
            route,
            input.minTraceWidth,
          )
          const { db } = port.root!
          const sourceNet = db.source_net.get(
            connection.netConnectionName ?? connection.name,
          )
          // Resolve an internal trunk's source before any neighboring copper
          // is inserted, so replay order cannot change ownership.
          const sourceTraceId =
            getSourceTraceIdForRoutedTrace({
              db,
              trace: { ...trace, source_trace_id: sourceNet?.source_net_id },
              subcircuit_id: port.getSubcircuit().subcircuit_id,
            }) ?? connection.source_trace_id
          return { ...trace, source_trace_id: sourceTraceId }
        },
      ),
    }

  const preparedPaths = prepareSavedPaths(savedPhase)
  const remainingPointsByConnection = new Map(
    input.connections.map((connection) => [
      connection,
      [...connection.pointsToConnect],
    ]),
  )
  const coveredConnections = new Set<SimpleRouteConnection>()
  const savedPorts = new Set<Port>()
  const traces: SimplifiedPcbTrace[] = []

  for (const [
    pathIndex,
    { selector, port, route },
  ] of preparedPaths.entries()) {
    if (savedPorts.has(port))
      throw new Error(`Duplicate saved phase path for "${selector}"`)
    savedPorts.add(port)
    const connections = input.connections.filter((connection) =>
      connection.pointsToConnect.some(
        (point) => point.pcb_port_id === port.pcb_port_id,
      ),
    )
    if (connections.length !== 1) {
      throw new Error(
        `Saved phase path "${selector}" must select exactly one connection in this phase`,
      )
    }
    const connection = connections[0]!
    const remainingPoints = remainingPointsByConnection.get(connection)!
    const startIndex = remainingPoints.findIndex(
      (point) => point.pcb_port_id === port.pcb_port_id,
    )
    if (startIndex < 0)
      throw new Error(
        `Saved phase path "${selector}" starts at an endpoint already joined by another path`,
      )
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
        `Saved phase path "${selector}" must start at its PCB port on an available layer`,
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
        `Saved phase path "${selector}" has a via at a pad; enable allowViaInPad`,
      )
    }
    const pcbTraceId = `${traceIdPrefix}_${pathIndex}`
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
    traces.push(
      makeSavedTrace(pcbTraceId, connection, route, input.minTraceWidth),
    )
  }
  for (const connection of input.connections) {
    if (!coveredConnections.has(connection)) {
      throw new Error(
        `pcbTracePaths must cover every connection in the phase; missing: ${connection.name}`,
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
    outputSimpleRouteJson: {
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
    },
  }
}

/** Validate complete phases on export and replay, before assigning source IDs. */
export function getValidatedCompleteSavedPaths(savedPhase: SavedPhasePaths) {
  const { input } = savedPhase
  const paths = prepareSavedPaths(savedPhase)
  const db = paths[0]?.port.root?.db
  const contacts = getSavedPhaseRouteContacts(
    paths.map(({ route }) => route),
    input,
    (id) => db?.pcb_port.get(id),
  )

  // Shared ports and SRJ aliases establish logical net membership. Only
  // saved copper contacts and declared existing links can satisfy them.
  const nets = new ConnectivityMap({})
  nets.addConnections(
    input.connections.map((connection) => [
      ...[
        connection.name,
        connection.netConnectionName,
        connection.rootConnectionName,
        ...(connection.mergedConnectionNames ?? []),
      ]
        .filter((name): name is string => name !== undefined)
        .map((name) => `connection:${name}`),
      ...connection.pointsToConnect.flatMap(({ pcb_port_id, pointId }) => [
        ...(pcb_port_id ? [`port:${pcb_port_id}`] : []),
        ...(pointId ? [`point:${pointId}`] : []),
      ]),
    ]),
  )
  const netOf = ({ name }: SimpleRouteConnection) =>
    nets.getNetConnectedToId(`connection:${name}`)
  const phasePortIds = new Set(
    input.connections.flatMap(({ pointsToConnect }) =>
      pointsToConnect.map(({ pcb_port_id }) => pcb_port_id),
    ),
  )
  const seenRoutes = new Set<string>()
  const pcbPorts = input.allowViaInPad ? [] : (db?.pcb_port.list() ?? [])
  const validatedPaths = paths.map(({ selector, port, route }, routeIndex) => {
    if (!port.pcb_port_id || !phasePortIds.has(port.pcb_port_id)) {
      throw new Error(
        `Saved phase path "${selector}" must select a connection in this phase`,
      )
    }
    const key = JSON.stringify(route)
    if (seenRoutes.has(key))
      throw new Error(`Duplicate saved phase path for "${selector}"`)
    seenRoutes.add(key)

    if (
      route.some((point) => {
        if (point.route_type !== "via") return false
        const layers = getSavedRoutePointLayers(point, input)
        return pcbPorts.some(
          (pad) =>
            Math.hypot(point.x - pad.x, point.y - pad.y) <=
              SAVED_ROUTE_CONTACT_TOLERANCE &&
            layers.some((layer) => pad.layers.includes(layer)),
        )
      })
    ) {
      throw new Error(
        `Saved phase path "${selector}" has a via at a pad; enable allowViaInPad`,
      )
    }

    const terminals = contacts.getRouteTerminals(routeIndex)
    const anchor = terminals.find(
      ({ point }) => point.pcb_port_id === port.pcb_port_id,
    )
    if (!anchor) {
      throw new Error(
        `Saved phase path "${selector}" must start at its PCB port or join saved copper connected to that port`,
      )
    }
    const { connection } = anchor
    const net = netOf(connection)
    if (terminals.some((terminal) => netOf(terminal.connection) !== net)) {
      throw new Error(`Saved phase path "${selector}" touches a different net`)
    }
    const first = route[0]!
    const last = route.at(-1)!
    const closed =
      Math.hypot(first.x - last.x, first.y - last.y) <=
        SAVED_ROUTE_CONTACT_TOLERANCE &&
      getSavedRoutePointLayers(first, input).some((layer) =>
        getSavedRoutePointLayers(last, input).includes(layer),
      )
    if (
      !closed &&
      [first, last].some(
        (point) => !contacts.isEndpointConnected(routeIndex, point),
      )
    ) {
      throw new Error(
        `Saved phase path "${selector}" must end at another connection endpoint or join saved copper`,
      )
    }

    return { port, route, connection }
  })

  const copperComponents = new Set(contacts.routeComponents)
  for (const connection of input.connections) {
    const components = contacts.componentsByConnection.get(connection)
    const label =
      connection.pointsToConnect[0]?.port_selector ?? "unnamed connection"
    if (
      !components ||
      ![...components].some((component) => copperComponents.has(component))
    ) {
      throw new Error(
        `pcbTracePaths must cover every connection in the phase; missing: ${label}`,
      )
    }
    if (components.size > 1) {
      throw new Error(
        `Saved phase paths for "${label}" must connect every endpoint with copper`,
      )
    }
  }
  return validatedPaths
}

function makeSavedTrace(
  pcbTraceId: string,
  connection: SimpleRouteConnection,
  route: SavedPcbTracePath["route"],
  minTraceWidth: number,
): SimplifiedPcbTrace {
  return {
    type: "pcb_trace",
    pcb_trace_id: pcbTraceId,
    connection_name: connection.name,
    connectsTo: [
      connection.source_trace_id,
      ...connection.pointsToConnect.map((point) => point.pointId),
    ].filter((id): id is string => Boolean(id)),
    // Explicit wire contacts preserve the saved copper on both sides of a via.
    route: route.flatMap((point, index): SavedPcbTracePath["route"] => {
      if (point.route_type !== "via") return [point]
      const { fromWidth, toWidth } = getSavedTraceViaContactWidths(
        route,
        index,
        minTraceWidth,
      )
      const arrival = {
        route_type: "wire" as const,
        x: point.x,
        y: point.y,
        layer: point.to_layer,
        width: toWidth,
      }
      return [
        { ...arrival, layer: point.from_layer, width: fromWidth },
        point,
        arrival,
        ...(index === route.length - 1 ? [{ ...arrival }] : []),
      ]
    }),
  }
}
