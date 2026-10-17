import { fanoutTracePath } from "@tscircuit/props"
import { applyToPoint, inverse } from "transformation-matrix"
import type { PcbPort } from "circuit-json"
import type { z } from "zod"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
  SingleLayerConnectionPoint,
} from "lib/utils/autorouting/SimpleRouteJson"
import type { Port } from "../Port"
import type { IGroup } from "./IGroup"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"
import { getSavedPcbTracePathTransform } from "./get-saved-pcb-trace-path-transform"
import { getSavedAutoroutingPhaseTracesFromPaths } from "./get-saved-autorouting-phase-traces"

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

/**
 * Export only this routing stage's copper, using port selectors and the enclosing
 * group's local PCB frame: mm, +X right, +Y up, +Z above, right-handed. These are
 * points (translation applies); physical board layers are unchanged. The input
 * SRJ and solver traces are board-world points. Neither is mutated.
 *
 * Every exported array is validated by the saved-path importer. Routes outside
 * that API's port-anchored wire/via model produce an explicit reason, never a
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
    const connectionByTerminal = new Map<
      SingleLayerConnectionPoint,
      SimpleRouteJson["connections"][number]
    >()
    for (const connection of input.connections) {
      for (const point of connection.pointsToConnect) {
        connectionByTerminal.set(point, connection)
      }
    }
    const portName = (terminal: SingleLayerConnectionPoint) => {
      const terminalPort = terminal.pcb_port_id
        ? portsByPcbPortId.get(terminal.pcb_port_id)
        : undefined
      return (
        terminal.port_selector ??
        terminalPort?.getPortSelector() ??
        "unnamed port"
      )
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
          // A router may connect one net as a tree that reaches a connection's
          // port through another connection's port rather than with a trace
          // between the two. Saved paths join endpoints of a single connection,
          // so report that shape here instead of letting the saved-path importer
          // blame this anchor for ending on the wrong endpoint.
          const anchorConnection = connectionByTerminal.get(terminal)
          const oppositeTerminal = endpoints[routeIndex]![
            reverse ? 0 : 1
          ]!.filter(
            (opposite) =>
              opposite.pcb_port_id &&
              connectionByTerminal.get(opposite) !== anchorConnection,
          ).at(0)
          if (oppositeTerminal && !isFanout) {
            throw new Error(
              `Route between ${portName(terminal)} and ${portName(oppositeTerminal)} spans separate connections of the same net; the router reached one port through the other instead of tracing between them, which a saved path cannot express`,
            )
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
