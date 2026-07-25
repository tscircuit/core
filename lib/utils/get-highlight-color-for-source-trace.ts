import type { Net } from "lib/components/primitive-components/Net"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/**
 * `NetProps.highlightColor` is documented and `pcb_trace.highlight_color`
 * exists on the circuit-JSON schema, but nothing carried the value across.
 *
 * `source_net` has no highlight field, so the colour has to come from the `Net`
 * component. This resolves it from a `source_trace_id` by matching the trace's
 * connected nets back to their components.
 */
export const getHighlightColorForSourceTrace = ({
  db,
  group,
  sourceTraceId,
}: {
  db: any
  group: PrimitiveComponent
  sourceTraceId?: string | null
}): string | undefined => {
  if (!sourceTraceId) return undefined

  const sourceTrace = db.source_trace.get(sourceTraceId)
  const connectedNetIds: string[] = sourceTrace?.connected_source_net_ids ?? []
  if (connectedNetIds.length === 0) return undefined

  const nets = group.selectAll("net") as Net[]
  for (const net of nets) {
    if (!net.source_net_id) continue
    if (!connectedNetIds.includes(net.source_net_id)) continue
    const highlightColor = net._parsedProps?.highlightColor
    if (highlightColor) return highlightColor
  }

  return undefined
}
