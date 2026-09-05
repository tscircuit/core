import type { SourceNet, SourceTrace } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Port } from "lib/components/primitive-components/Port/Port"
import type { SimpleRouteConnection } from "./SimpleRouteJson"

/**
 * Resolve a routing constraint's trace name or port selector within its
 * subcircuit. Trace names take precedence over port selectors. Return all
 * matches so callers can report missing or ambiguous selections in context.
 */
export const getSourceTracesForRoutingConnectionSelector = ({
  subcircuit,
  sourceTraces,
  traceNameOrPortSelector,
}: {
  subcircuit: Pick<PrimitiveComponent, "selectOne">
  sourceTraces: SourceTrace[]
  traceNameOrPortSelector: string
}): SourceTrace[] => {
  const namedTraces = sourceTraces.filter(
    (trace) => trace.name === traceNameOrPortSelector,
  )
  if (namedTraces.length > 0) return namedTraces

  const port = subcircuit.selectOne<Port>(traceNameOrPortSelector, {
    type: "port",
  })
  const sourcePortId = port?.source_port_id
  if (!sourcePortId) return []
  return sourceTraces.filter((trace) =>
    trace.connected_source_port_ids.includes(sourcePortId),
  )
}

/**
 * Map selected source traces to routing connections through electrical
 * connectivity, independent of whether SRJ represents a trace or a merged
 * net. sourceTraces must belong to the same subcircuit as selectedSourceTraces.
 * Keep all breakout connections; routing consumers decide which groups apply.
 */
export const getSrjConnectionsForSourceTraces = ({
  selectedSourceTraces,
  sourceTraces,
  srjConnections,
}: {
  selectedSourceTraces: SourceTrace[]
  sourceTraces: SourceTrace[]
  srjConnections: SimpleRouteConnection[]
}): SimpleRouteConnection[] => {
  const traceIds = new Set<SourceTrace["source_trace_id"]>()
  const netIds = new Set<SourceNet["source_net_id"]>()
  const connectivityKeys = new Set<
    NonNullable<SourceTrace["subcircuit_connectivity_map_key"]>
  >()
  for (const trace of selectedSourceTraces) {
    traceIds.add(trace.source_trace_id)
    if (trace.subcircuit_connectivity_map_key) {
      connectivityKeys.add(trace.subcircuit_connectivity_map_key)
    }
  }
  for (const trace of sourceTraces) {
    if (
      traceIds.has(trace.source_trace_id) ||
      (trace.subcircuit_connectivity_map_key &&
        connectivityKeys.has(trace.subcircuit_connectivity_map_key))
    ) {
      traceIds.add(trace.source_trace_id)
      for (const netId of trace.connected_source_net_ids ?? []) {
        netIds.add(netId)
      }
    }
  }
  return srjConnections.filter(
    (connection) =>
      netIds.has(connection.name) ||
      (connection.source_trace_id !== undefined &&
        traceIds.has(connection.source_trace_id)),
  )
}
