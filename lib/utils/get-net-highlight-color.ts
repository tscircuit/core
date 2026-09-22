import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent/PrimitiveComponent"
import type { Net } from "lib/components/primitive-components/Net"

/**
 * Resolves the `highlightColor` prop of the `<net>` connected to a
 * source trace, so it can be written to `pcb_trace.highlight_color`.
 */
export const getNetHighlightColor = (
  component: PrimitiveComponent,
  sourceTraceId: string | null | undefined,
): string | undefined => {
  if (!sourceTraceId) return undefined
  const { db } = component.root!
  const sourceTrace = db.source_trace.get(sourceTraceId)
  const netIds = sourceTrace?.connected_source_net_ids
  if (!netIds?.length) return undefined
  const net = (component.getSubcircuit().selectAll("net") as Net[]).find(
    (n) => n.source_net_id && netIds.includes(n.source_net_id),
  )
  return net?._parsedProps.highlightColor
}
