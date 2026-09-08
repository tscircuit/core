import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

interface NetWithHighlightColor {
  source_net_id?: string | null
  _parsedProps: { highlightColor?: string }
}

interface TraceWithHighlightColor {
  source_trace_id?: string | null
  _parsedProps: { highlightColor?: string }
}

/**
 * Resolve the highlight_color for a routed pcb_trace.
 *
 * A net or trace's highlightColor lives on the React/fiber component
 * (props.highlightColor), not on source_net, which has no field for it.
 * If the source trace defines an explicit highlightColor, that takes precedence.
 * Otherwise, we walk source_trace.connected_source_net_ids back to the matching
 * Net component and return the first highlightColor found.
 */
export function getHighlightColorForRoutedTrace({
  db,
  nets,
  traces,
  sourceTraceId,
}: {
  db: CircuitJsonUtilObjects
  nets: NetWithHighlightColor[]
  traces?: TraceWithHighlightColor[]
  sourceTraceId: string | undefined | null
}): string | undefined {
  if (!sourceTraceId) return undefined

  if (traces && traces.length > 0) {
    const trace = traces.find((t) => t.source_trace_id === sourceTraceId)
    if (trace?._parsedProps?.highlightColor) {
      return trace._parsedProps.highlightColor
    }
  }

  if (nets.length === 0) return undefined

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
