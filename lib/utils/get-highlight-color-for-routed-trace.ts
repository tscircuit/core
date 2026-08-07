import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

interface NetWithHighlightColor {
  source_net_id?: string
  _parsedProps: { highlightColor?: string }
}

/**
 * Resolve the highlight_color for a routed pcb_trace.
 *
 * A net's highlightColor lives on the Net component (props.highlightColor),
 * not on source_net, which has no field for it. So given a routed trace's
 * source_trace_id, we walk source_trace.connected_source_net_ids back to the
 * matching Net component and return the first highlightColor found. If the id
 * is itself a source_net_id (getSourceTraceIdForRoutedTrace can return one), we
 * match that net directly.
 */
export function getHighlightColorForRoutedTrace({
  db,
  nets,
  sourceTraceId,
}: {
  db: CircuitJsonUtilObjects
  nets: NetWithHighlightColor[]
  sourceTraceId: string | undefined
}): string | undefined {
  if (!sourceTraceId || nets.length === 0) return undefined

  const sourceTrace = db.source_trace.get(sourceTraceId)
  const connectedSourceNetIds = sourceTrace
    ? sourceTrace.connected_source_net_ids
    : db.source_net.get(sourceTraceId)
      ? [sourceTraceId]
      : []

  for (const sourceNetId of connectedSourceNetIds ?? []) {
    const net = nets.find((n) => n.source_net_id === sourceNetId)
    const highlightColor = net?._parsedProps?.highlightColor
    if (highlightColor) return highlightColor
  }

  return undefined
}
