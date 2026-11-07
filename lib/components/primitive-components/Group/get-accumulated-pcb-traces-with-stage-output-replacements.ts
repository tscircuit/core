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
  const fixedPcbTraceById = new Map(
    accumulatedPcbTraces
      .filter((trace) => trace.isFixed)
      .map((trace) => [trace.pcb_trace_id, trace] as const),
  )
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
    ...stageOutputPcbTraces.map((trace) => {
      let fixedTrace = fixedPcbTraceById.get(trace.pcb_trace_id)
      if (trace.__replaces_pcb_trace_id !== undefined) {
        const replacedFixedTrace = fixedPcbTraceById.get(
          trace.__replaces_pcb_trace_id,
        )
        if (replacedFixedTrace) {
          if (trace.pcb_trace_id !== replacedFixedTrace.pcb_trace_id) {
            throw new Error("A routing stage attempted to remove fixed copper")
          }
          fixedTrace = replacedFixedTrace
        }
      }
      if (!fixedTrace) return trace
      if (
        trace.pcb_trace_id !== fixedTrace.pcb_trace_id ||
        JSON.stringify(trace.route) !== JSON.stringify(fixedTrace.route)
      ) {
        throw new Error("A routing stage attempted to replace fixed copper")
      }
      return { ...trace, isFixed: true }
    }),
  ]
}
