import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Treat a stage's returned trace with an existing or explicitly replaced
 * pcb_trace_id as authoritative over the accumulated trace from an earlier
 * stage.
 */
export function getAccumulatedPcbTracesWithStageOutputReplacements({
  accumulatedPcbTraces,
  stageOutputPcbTraces,
}: {
  accumulatedPcbTraces: SimplifiedPcbTrace[]
  stageOutputPcbTraces: SimplifiedPcbTrace[]
}): SimplifiedPcbTrace[] {
  const replacedPcbTraceIds = new Set(
    stageOutputPcbTraces.flatMap((trace) => [
      trace.pcb_trace_id,
      ...(trace.__replaces_pcb_trace_id ? [trace.__replaces_pcb_trace_id] : []),
    ]),
  )

  return [
    ...accumulatedPcbTraces.filter(
      (trace) => !replacedPcbTraceIds.has(trace.pcb_trace_id),
    ),
    ...stageOutputPcbTraces,
  ]
}
