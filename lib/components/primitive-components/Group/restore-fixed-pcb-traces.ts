import type {
  PcbTraceId,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

/** Restore fixed routes in place, removing any solver replacements of them. */
export function restoreFixedPcbTraces({
  stageOutputPcbTraces,
  stageInputFixedPcbTraces,
}: {
  stageOutputPcbTraces: SimplifiedPcbTrace[]
  stageInputFixedPcbTraces: SimplifiedPcbTrace[]
}): SimplifiedPcbTrace[] {
  if (stageInputFixedPcbTraces.length === 0) return stageOutputPcbTraces
  const fixedPcbTracesById = new Map<PcbTraceId, SimplifiedPcbTrace>(
    stageInputFixedPcbTraces.map((trace) => [trace.pcb_trace_id, trace]),
  )
  const restoredPcbTraceIds = new Set<PcbTraceId>()
  const restoredPcbTraces = stageOutputPcbTraces.flatMap((trace) => {
    const fixedPcbTrace =
      fixedPcbTracesById.get(trace.pcb_trace_id) ??
      (trace.__replaces_pcb_trace_id
        ? fixedPcbTracesById.get(trace.__replaces_pcb_trace_id)
        : undefined)
    if (!fixedPcbTrace) return [trace]
    if (restoredPcbTraceIds.has(fixedPcbTrace.pcb_trace_id)) return []
    restoredPcbTraceIds.add(fixedPcbTrace.pcb_trace_id)
    return [fixedPcbTrace]
  })
  return restoredPcbTraces.concat(
    [...fixedPcbTracesById.values()].filter(
      (trace) => !restoredPcbTraceIds.has(trace.pcb_trace_id),
    ),
  )
}
