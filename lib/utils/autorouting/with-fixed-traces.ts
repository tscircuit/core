import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

/**
 * Keep manual and saved copper as fixed traces for subsequent solvers.
 * Route points remain in board-world mm (+X right, +Y up, +Z above,
 * right-handed); no coordinates or layer spans are transformed.
 */
export function withFixedTraces(
  input: SimpleRouteJson,
  fixedTraceIds: ReadonlySet<PcbTraceId>,
): SimpleRouteJson {
  if (fixedTraceIds.size === 0) return input
  if (!input.traces?.some((trace) => fixedTraceIds.has(trace.pcb_trace_id))) {
    return input
  }

  return {
    ...input,
    traces: input.traces.map((trace) => {
      if (!fixedTraceIds.has(trace.pcb_trace_id)) return trace
      return { ...trace, isFixed: true }
    }),
  }
}
