import type { Net } from "./Net"
import type { PcbTrace } from "./PcbTrace"

export const PcbTrace_doInitialSourceTraceRender = (
  pcbTrace: PcbTrace,
): void => {
  const { source_trace_id, connectsTo } = pcbTrace._parsedProps
  if (source_trace_id) {
    pcbTrace.source_trace_id = source_trace_id
    return
  }
  if (!connectsTo) return

  const { db } = pcbTrace.root!
  const subcircuit = pcbTrace.getSubcircuit()
  const net = subcircuit.selectOne<Net>(connectsTo, { type: "net" })
  if (!net?.source_net_id) {
    pcbTrace.renderError(
      `Could not find net for PCB trace selector "${connectsTo}"`,
    )
    return
  }
  const sourceNetId = net.source_net_id
  const existingSourceTrace = db.source_trace
    .list()
    .find((sourceTrace) =>
      sourceTrace.connected_source_net_ids.includes(sourceNetId),
    )

  if (existingSourceTrace) {
    pcbTrace.source_trace_id = existingSourceTrace.source_trace_id
    return
  }

  pcbTrace.source_trace_id = db.source_trace.insert({
    connected_source_port_ids: [],
    connected_source_net_ids: [sourceNetId],
    subcircuit_id: subcircuit.subcircuit_id ?? undefined,
    display_name: `${connectsTo} imported PCB copper`,
  }).source_trace_id
}
