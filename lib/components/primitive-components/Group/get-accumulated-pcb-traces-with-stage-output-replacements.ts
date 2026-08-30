import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Treat a stage's returned trace with an existing pcb_trace_id as the
 * authoritative replacement for the accumulated trace from an earlier stage.
 */
export function getAccumulatedPcbTracesWithStageOutputReplacements({
  accumulatedPcbTraces,
  stageOutputPcbTraces,
}: {
  accumulatedPcbTraces: SimplifiedPcbTrace[]
  stageOutputPcbTraces: SimplifiedPcbTrace[]
}): SimplifiedPcbTrace[] {
  const uniqueStageOutputPcbTracesById = new Map(
    stageOutputPcbTraces.map((trace) => [trace.pcb_trace_id, trace]),
  )
  const uniqueStageOutputPcbTraces = [
    ...uniqueStageOutputPcbTracesById.values(),
  ]
  const stageOutputPcbTraceIds = new Set(
    uniqueStageOutputPcbTraces.map((trace) => trace.pcb_trace_id),
  )

  return [
    ...accumulatedPcbTraces.filter(
      (trace) => !stageOutputPcbTraceIds.has(trace.pcb_trace_id),
    ),
    ...uniqueStageOutputPcbTraces,
  ]
}
