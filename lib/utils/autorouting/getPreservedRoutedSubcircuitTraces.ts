import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
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
  route?: PreservedTraceRoutePoint[]
}

const getPreservedTraceConnectionName = (trace: PreservedTrace) =>
  trace.source_trace_id ?? trace.connection_name ?? trace.pcb_trace_id

const getConnectedToIdsForPreservedTrace = ({
  trace,
  connectionName,
  scopedDb,
  sharedConnMap,
}: {
  trace: PreservedTrace
  connectionName: string
  scopedDb: CircuitJsonUtilObjects
  sharedConnMap: ConnectivityMap
}) => {
  const connectedToIds = new Set<string>()
  const addConnectedId = (id?: string | null) => {
    if (!id) return
    connectedToIds.add(id)
    const connectivityNetId = sharedConnMap.getNetConnectedToId(id)
    if (!connectivityNetId) return
    connectedToIds.add(connectivityNetId)
    for (const connectedId of sharedConnMap.getIdsConnectedToNet(
      connectivityNetId,
    )) {
      connectedToIds.add(connectedId)
    }
  }

  addConnectedId(connectionName)
  addConnectedId(trace.source_trace_id)

  const sourceTrace = trace.source_trace_id
    ? scopedDb.source_trace.get(trace.source_trace_id)
    : null
  if (sourceTrace) {
    for (const id of sourceTrace.connected_source_net_ids ?? []) {
      addConnectedId(id)
    }
    for (const id of sourceTrace.connected_source_port_ids ?? []) {
      addConnectedId(id)
    }
  }

  for (const routePoint of trace.route ?? []) {
    if (routePoint.route_type !== "wire") continue
    for (const pcbPortId of [
      routePoint.start_pcb_port_id,
      routePoint.end_pcb_port_id,
    ]) {
      addConnectedId(pcbPortId)
      const pcbPort = pcbPortId ? scopedDb.pcb_port.get(pcbPortId) : null
      addConnectedId(pcbPort?.source_port_id)
    }
  }

  return Array.from(connectedToIds)
}

/**
 * Converts already-routed child subcircuit pcb_traces into SRJ `traces`.
 *
 * `sharedConnMap` intentionally covers the whole SRJ routing scope: the
 * parent/current subcircuit and any included child subcircuits. A parentConnMap
 * would not know child-internal route IDs, and a childSubcircuitConnMap would
 * not know parent-side IDs. Preserved trace `connectedTo` metadata needs both
 * sides so the parent autorouter can legally touch child fanout copper on the
 * same underlying connection.
 */
export const getPreservedRoutedSubcircuitTraces = ({
  scopedDb,
  currentSubcircuitId,
  relevantSubcircuitIds,
  sharedConnMap,
}: {
  scopedDb: CircuitJsonUtilObjects
  currentSubcircuitId?: string | null
  relevantSubcircuitIds: Set<string> | null
  sharedConnMap: ConnectivityMap
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
        connectedTo: getConnectedToIdsForPreservedTrace({
          trace: preservedTrace,
          connectionName,
          scopedDb,
          sharedConnMap,
        }),
        route: trace.route as SimplifiedPcbTrace["route"],
      }
    })
    .filter((trace) => trace.route.length >= 2)
