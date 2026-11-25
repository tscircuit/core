import type { SourceTrace } from "circuit-json"
import type { Bus } from "lib/components/primitive-components/Bus"
import type {
  SimpleRouteConnection,
  SimplifiedPcbTrace,
  SrjConnectionName,
} from "./SimpleRouteJson"

export const getBusSrjConnectionNamesOrThrow = ({
  srjConnections,
  bus,
  sourceTraceId,
  traceNameOrPortSelector,
  busSourceTraces,
  fixedTraces = [],
}: {
  fixedTraces?: SimplifiedPcbTrace[]
  srjConnections: SimpleRouteConnection[]
  bus: Bus
  sourceTraceId: SourceTrace["source_trace_id"]
  traceNameOrPortSelector: string
  busSourceTraces: SourceTrace[]
}): SrjConnectionName[] => {
  // Branches can share an electrical net but still be distinct bus members.
  // Resolve their own routing connections before falling back to net routing.
  const directSrjConnections = srjConnections.filter(
    (srjConnection) => srjConnection.source_trace_id === sourceTraceId,
  )
  if (directSrjConnections.length > 0) {
    return directSrjConnections.map((srjConnection) => srjConnection.name)
  }

  const sourceTrace = busSourceTraces.find(
    (trace) => trace.source_trace_id === sourceTraceId,
  )!
  const connectedSourceTraces = busSourceTraces.filter(
    (trace) =>
      trace.source_trace_id === sourceTraceId ||
      (sourceTrace.subcircuit_connectivity_map_key !== undefined &&
        trace.subcircuit_connectivity_map_key ===
          sourceTrace.subcircuit_connectivity_map_key),
  )
  const connectedSourceNetIds = new Set(
    connectedSourceTraces.flatMap(
      (trace) => trace.connected_source_net_ids ?? [],
    ),
  )
  const matchingSrjConnections = srjConnections.filter((srjConnection) =>
    connectedSourceNetIds.has(srjConnection.name),
  )

  const names = new Set(
    matchingSrjConnections.map((connection) => connection.name),
  )
  for (const trace of fixedTraces) {
    if (
      trace.connection_name &&
      (connectedSourceNetIds.has(trace.connection_name) ||
        trace.connection_name === sourceTraceId)
    )
      names.add(trace.connection_name)
  }
  if (names.size === 0) {
    throw new Error(
      `Could not find an SRJ connection for "${traceNameOrPortSelector}" in bus "${bus.name}"`,
    )
  }
  return [...names]
}
