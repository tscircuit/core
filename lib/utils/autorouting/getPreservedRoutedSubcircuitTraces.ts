import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

type PreservedTraceRoutePoint = {
  route_type?: string
  start_pcb_port_id?: string
  end_pcb_port_id?: string
}

type PreservedTrace = {
  pcb_trace_id: string
  source_trace_id?: string
  connection_name?: string
  connectsTo?: string[]
  route?: PreservedTraceRoutePoint[]
}

const getPreservedTraceConnectionName = (trace: PreservedTrace) =>
  trace.source_trace_id ?? trace.connection_name ?? trace.pcb_trace_id

const getPhysicalConnectionIdsForPreservedTrace = (trace: PreservedTrace) => {
  const physicallyConnectedIds = new Set(trace.connectsTo ?? [])
  for (const routePoint of trace.route ?? []) {
    if (routePoint.route_type !== "wire") continue
    for (const pcbPortId of [
      routePoint.start_pcb_port_id,
      routePoint.end_pcb_port_id,
    ]) {
      if (pcbPortId) physicallyConnectedIds.add(pcbPortId)
    }
  }

  return Array.from(physicallyConnectedIds)
}

/**
 * Converts already-routed child subcircuit pcb_traces into SRJ `traces`.
 *
 * `connectsTo` is physical routing state, not electrical-net metadata. It must
 * contain only the PCB points joined by this exact copper trace so the parent
 * router can collapse already-routed child paths without collapsing an entire
 * net that still needs board-level routing.
 */
export const getPreservedRoutedSubcircuitTraces = ({
  scopedDb,
  currentSubcircuitId,
  relevantSubcircuitIds,
}: {
  scopedDb: CircuitJsonUtilObjects
  currentSubcircuitId?: string | null
  relevantSubcircuitIds: Set<string> | null
}): SimplifiedPcbTrace[] =>
  scopedDb.pcb_trace
    .list()
    .filter((trace) => {
      if (!trace.subcircuit_id) return false

      if (!currentSubcircuitId) return true

      return (
        trace.subcircuit_id !== currentSubcircuitId &&
        relevantSubcircuitIds!.has(trace.subcircuit_id)
      )
    })
    .map((trace) => {
      const preservedTrace = trace as PreservedTrace
      const connectionName = getPreservedTraceConnectionName(preservedTrace)
      return {
        type: "pcb_trace" as const,
        pcb_trace_id: trace.pcb_trace_id,
        source_trace_id: trace.source_trace_id,
        connection_name: connectionName,
        connectsTo: getPhysicalConnectionIdsForPreservedTrace(preservedTrace),
        route: trace.route as SimplifiedPcbTrace["route"],
      }
    })
    .filter((trace) => trace.route.length >= 2)
