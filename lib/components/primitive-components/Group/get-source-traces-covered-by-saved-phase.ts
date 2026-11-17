import type { PcbPort } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"
import { getSavedRouteConnectivity } from "lib/utils/autorouting/get-saved-route-connectivity"
import type { AutoroutingPhase } from "../AutoroutingPhase"
import type { Port } from "../Port"
import type { Trace } from "../Trace/Trace"
import { getSavedPcbTracePathTransform } from "./get-saved-pcb-trace-path-transform"

/**
 * Infer source traces covered by saved copper, without claiming the rest of a
 * partially saved net. Saved points use the phase group's local PCB frame;
 * the shared importer transform maps them to board-world mm (+X right, +Y up,
 * +Z above; right-handed). These are points, so translation applies. PCB port
 * positions are already board-world points and their layers remain unchanged.
 */
export function getSourceTracesCoveredBySavedPhase(
  phase: AutoroutingPhase,
  traces: Trace[],
): Set<Trace> {
  const subcircuit = phase.getSubcircuit()
  const { db } = phase.root!
  const routes = (phase._parsedProps.pcbTracePaths ?? []).map((path) => {
    const port = subcircuit.selectOne(path.connection, {
      type: "port",
    }) as Port | null
    if (!port)
      throw new Error(
        `Saved phase path "${path.connection}" must select a PCB port`,
      )
    const transform = getSavedPcbTracePathTransform(phase.getGroup()!, port)
    return path.route.map((point) => ({
      ...point,
      ...applyToPoint(transform, point),
    }))
  })
  const connectionsByTrace = new Map<Trace, SimpleRouteConnection>(
    traces.map((trace) => {
      const ports = trace._findConnectedPorts().ports ?? []
      const pcbPorts = ports
        .map((port) => db.pcb_port.get(port.pcb_port_id!))
        .filter((port): port is PcbPort => port !== null)
      return [
        trace,
        {
          name: trace.source_trace_id!,
          pointsToConnect: pcbPorts.map((port) => ({
            x: port.x,
            y: port.y,
            layer: port.layers[0]!,
            pcb_port_id: port.pcb_port_id,
          })),
        },
      ]
    }),
  )
  const boardComponent = phase._getBoard()
  const board = boardComponent?.pcb_board_id
    ? db.pcb_board.get(boardComponent.pcb_board_id)
    : undefined
  const graph = getSavedRouteConnectivity({
    routes,
    input: {
      connections: [...connectionsByTrace.values()],
      layerCount: subcircuit._getSubcircuitLayerCount(),
      allowBlindAndBuriedVias: board?.allow_blind_and_buried_vias,
    },
    pcbPorts: db.pcb_port.list(),
  })
  return new Set(
    traces.filter((trace) => {
      const connection = connectionsByTrace.get(trace)!
      const components = graph.terminals.flatMap((terminal, index) =>
        terminal.connection === connection
          ? [graph.terminalComponents[index]!]
          : [],
      )
      return (
        components.length > 0 &&
        new Set(components).size === 1 &&
        graph.routeComponents.includes(components[0]!)
      )
    }),
  )
}
