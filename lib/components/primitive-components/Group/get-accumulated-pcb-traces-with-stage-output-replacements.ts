import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/** Pipeline9 can return an unchanged preloaded trace once per routed region. */
export function getUniquePcbTraces(
  traces: SimplifiedPcbTrace[],
): SimplifiedPcbTrace[] {
  const serializedTraces = new Set<string>()
  return traces.filter((trace) => {
    const serializedTrace = JSON.stringify(trace)
    if (serializedTraces.has(serializedTrace)) return false
    serializedTraces.add(serializedTrace)
    return true
  })
}

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
  const uniqueStageOutputPcbTraces = getUniquePcbTraces(stageOutputPcbTraces)
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
