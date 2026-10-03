import { fanoutTracePath } from "@tscircuit/props"
import type { LayerRef, PcbPort } from "circuit-json"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SingleLayerConnectionPoint,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getLogicalConnectionGroups } from "lib/utils/autorouting/get-logical-connection-groups"
import { getRouteConnectivity } from "lib/utils/autorouting/get-route-connectivity"
import {
  getAutoroutedViaLayers,
  getViaBoardLayers,
} from "lib/utils/getViaSpanLayers"
import { applyToPoint, inverse } from "transformation-matrix"
import type { z } from "zod"
import type { Port } from "../Port"
import type { IGroup } from "./IGroup"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import { getSavedAutoroutingPhaseTracesFromPaths } from "./get-saved-autorouting-phase-traces"
import {
  getPcbTracePathAnchorPort,
  getSavedPcbTracePathTransform,
} from "./get-saved-pcb-trace-path-transform"

export type AutoroutingPhasePcbTracePaths = {
  pcbTracePaths?: z.output<typeof fanoutTracePath>[]
  pcbTracePathsUnavailableReason?: string
}

type PcbPortId = PcbPort["pcb_port_id"]
type WireOrVia = Extract<SimplifiedPcbTrace["route"][number], { x: number }>

const touches = (
  point: WireOrVia,
  terminal: SingleLayerConnectionPoint,
  end = false,
) =>
  Math.hypot(point.x - terminal.x, point.y - terminal.y) < 1e-4 &&
  (point.route_type === "wire"
    ? point.layer
    : end
      ? point.to_layer
      : point.from_layer) === terminal.layer

/** Preserve each solver trace once, keyed by its routing connection name. */
const getNetworkTracePaths = ({
  group,
  input,
  traces,
  portsByPcbPortId,
}: {
  group: Pick<IGroup, "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout">
  input: SimpleRouteJson
  traces: SimplifiedPcbTrace[]
  portsByPcbPortId: Map<PcbPortId, Port>
}): z.output<typeof fanoutTracePath>[] => {
  const boardLayers = getViaBoardLayers(input.layerCount)
  const isBoardLayer = (layer: string): layer is LayerRef =>
    boardLayers.some((boardLayer) => boardLayer === layer)
  const routes = traces.map((trace) => {
    if (
      trace.route.length < 2 ||
      trace.route.some(
        (point) => point.route_type !== "wire" && point.route_type !== "via",
      )
    ) {
      throw new Error("Only wire/via routes can be saved")
    }
    for (const point of trace.route) {
      if (point.route_type !== "via" || !point.layers) continue
      const fromLayer = point.from_layer
      const toLayer = point.to_layer
      const specifiedLayers = point.layers
      if (
        !isBoardLayer(fromLayer) ||
        !isBoardLayer(toLayer) ||
        !specifiedLayers.every(isBoardLayer)
      )
        throw new Error("Routed via uses a layer unavailable on this board")
      const physicalLayers = getAutoroutedViaLayers({
        fromLayer,
        toLayer,
        layerCount: input.layerCount,
        allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
        physicalLayers: specifiedLayers,
      })
      const replayedLayers = getAutoroutedViaLayers({
        fromLayer,
        toLayer,
        layerCount: input.layerCount,
        allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
      })
      if (physicalLayers.join(",") !== replayedLayers.join(","))
        throw new Error("Saved paths cannot preserve this via's layer span")
    }
    return trace.route as WireOrVia[]
  })
  const connectionByRoute = new Map<
    number,
    (typeof input.connections)[number]
  >()
  const logicalGroupByConnection = getLogicalConnectionGroups(input.connections)
  for (const [routeIndex, trace] of traces.entries()) {
    if (!trace.connection_name) continue
    const matchingConnections = input.connections.filter(
      (connection) => connection.name === trace.connection_name,
    )
    if (matchingConnections.length !== 1)
      throw new Error(
        `Routed trace segment references an unknown or ambiguous connection: ${trace.connection_name}`,
      )
    connectionByRoute.set(routeIndex, matchingConnections[0]!)
  }
  if (connectionByRoute.size < routes.length) {
    const connectivity = getRouteConnectivity({
      routes,
      layerCount: input.layerCount,
      allowBlindAndBuriedVias: input.allowBlindAndBuriedVias,
      contacts: [...portsByPcbPortId.values()].flatMap((port) => {
        const pcbPort = port.root?.db.pcb_port.get(port.pcb_port_id!)
        return pcbPort
          ? [{ x: pcbPort.x, y: pcbPort.y, layers: pcbPort.layers }]
          : []
      }),
    })
    for (const component of connectivity.components) {
      const unnamedRoutes = component.filter(
        (routeIndex) => !connectionByRoute.has(routeIndex),
      )
      if (unnamedRoutes.length === 0) continue
      const namedConnections = new Set(
        component.flatMap((routeIndex) => {
          const connection = connectionByRoute.get(routeIndex)
          return connection ? [connection] : []
        }),
      )
      const matchingConnections = namedConnections.size
        ? [...namedConnections]
        : input.connections.filter((connection) =>
            connection.pointsToConnect.some((terminal) => {
              const port = terminal.pcb_port_id
                ? portsByPcbPortId.get(terminal.pcb_port_id)
                : undefined
              const layers = terminal.pcb_port_id
                ? (port?.root?.db.pcb_port.get(terminal.pcb_port_id)
                    ?.layers ?? [terminal.layer])
                : [terminal.layer]
              return component.some((routeIndex) =>
                connectivity.routeTouchesPoint(routeIndex, terminal, layers),
              )
            }),
          )
      const matchingGroups = new Set(
        matchingConnections.map((connection) =>
          logicalGroupByConnection.get(connection),
        ),
      )
      if (matchingGroups.size !== 1)
        throw new Error(
          "Routed trace segments must touch exactly one electrical network",
        )
      for (const routeIndex of unnamedRoutes)
        connectionByRoute.set(routeIndex, matchingConnections[0]!)
    }
  }

  return routes.map((route, routeIndex) => {
    const connection = connectionByRoute.get(routeIndex)
    const anchor = connection
      ? getPcbTracePathAnchorPort(connection, portsByPcbPortId)
      : undefined
    if (!connection || !anchor)
      throw new Error("Routed trace segment has no PCB port for its connection")
    const transform = inverse(getSavedPcbTracePathTransform(group, anchor))
    return fanoutTracePath.parse({
      connection: connection.name,
      route: route.map((point) => ({
        ...point,
        ...applyToPoint(transform, point),
      })),
    })
  })
}

/**
 * Export only this routing stage's copper, using port selectors and the enclosing
 * group's local PCB frame: mm, +X right, +Y up, +Z above, right-handed. These are
 * points (translation applies); physical board layers are unchanged. The input
 * SRJ and solver traces are board-world points. Neither is mutated.
 *
 * Every exported array is validated by the saved-path importer. Routes outside
 * the supported wire/via network model produce an explicit reason, never a
 * partially replayable array. Export failure must not fail successful routing.
 */
export function getAutoroutingPhasePcbTracePaths({
  group,
  subcircuit,
  input,
  traces,
  isFanout,
}: {
  group: Pick<IGroup, "pcb_group_id" | "_computePcbGlobalTransformBeforeLayout">
  subcircuit: Pick<ISubcircuit, "selectOne" | "selectAll">
  input: SimpleRouteJson
  traces: SimplifiedPcbTrace[]
  isFanout: boolean
}): AutoroutingPhasePcbTracePaths {
  try {
    const portsByPcbPortId = new Map<PcbPortId, Port>(
      (subcircuit.selectAll("port") as Port[])
        .filter((port) => port.pcb_port_id)
        .map((port) => [port.pcb_port_id!, port]),
    )
    if (!isFanout) {
      const paths = getNetworkTracePaths({
        group,
        input,
        traces,
        portsByPcbPortId,
      })
      getSavedAutoroutingPhaseTracesFromPaths({
        group,
        subcircuit,
        paths,
        input,
        isFanout,
      })
      return { pcbTracePaths: paths }
    }
    const terminals = input.connections.flatMap(
      (connection) => connection.pointsToConnect,
    )
    const routes = traces.map((trace) => {
      if (
        trace.route.length < 2 ||
        trace.route.some(
          (point) => point.route_type !== "wire" && point.route_type !== "via",
        )
      ) {
        throw new Error("Only port-anchored wire/via routes can be saved")
      }
      return trace.route as WireOrVia[]
    })
    const endpoints = routes.map((route) => [
      terminals.filter((terminal) => touches(route[0]!, terminal)),
      terminals.filter((terminal) => touches(route.at(-1)!, terminal, true)),
    ])
    const degreeByTerminal = new Map<SingleLayerConnectionPoint, number>()
    for (const routeEndpoints of endpoints) {
      for (const terminal of new Set(routeEndpoints.flat())) {
        degreeByTerminal.set(
          terminal,
          (degreeByTerminal.get(terminal) ?? 0) + 1,
        )
      }
    }
    const paths: z.output<typeof fanoutTracePath>[] = []
    const usedPorts = new Set<Port>()
    const remainingRoutes = new Set(routes.keys())
    // Peel off leaves so each path starts at a still-available PCB port. This
    // matches the importer's endpoint-consumption order for multi-terminal nets.
    while (remainingRoutes.size) {
      let exported = false
      for (const routeIndex of remainingRoutes) {
        for (const reverse of [false, true]) {
          // Provisional fanout exits can coincide with a source pad. Only
          // physical ports can anchor a saved path; exits are not extra ports.
          const candidates = endpoints[routeIndex]![reverse ? 1 : 0]!.filter(
            (terminal) => terminal.pcb_port_id,
          )
          if (candidates.length !== 1) continue
          const terminal = candidates[0]!
          if (!terminal.pcb_port_id || degreeByTerminal.get(terminal) !== 1)
            continue
          const port = portsByPcbPortId.get(terminal.pcb_port_id)
          if (!port || usedPorts.has(port)) continue
          const selector = terminal.port_selector ?? port.getPortSelector()
          if (subcircuit.selectOne(selector, { type: "port" }) !== port) {
            throw new Error(`PCB port selector is not unique: ${selector}`)
          }
          const route = reverse
            ? routes[routeIndex]!.toReversed().map((point) =>
                point.route_type === "via"
                  ? {
                      ...point,
                      from_layer: point.to_layer,
                      to_layer: point.from_layer,
                    }
                  : point,
              )
            : routes[routeIndex]!
          const transform = inverse(getSavedPcbTracePathTransform(group, port))
          paths.push(
            fanoutTracePath.parse({
              connection: selector,
              route: route.map((point) => ({
                ...point,
                ...applyToPoint(transform, point),
              })),
            }),
          )
          usedPorts.add(port)
          remainingRoutes.delete(routeIndex)
          for (const endpoint of new Set(endpoints[routeIndex]!.flat())) {
            degreeByTerminal.set(endpoint, degreeByTerminal.get(endpoint)! - 1)
          }
          exported = true
          break
        }
      }
      if (!exported)
        throw new Error(
          "Routes contain a junction or endpoint that cannot select a unique PCB port",
        )
    }
    getSavedAutoroutingPhaseTracesFromPaths({
      group,
      subcircuit,
      paths,
      input,
      isFanout,
    })
    return { pcbTracePaths: paths }
  } catch (error) {
    return {
      pcbTracePathsUnavailableReason:
        error instanceof Error ? error.message : String(error),
    }
  }
}
