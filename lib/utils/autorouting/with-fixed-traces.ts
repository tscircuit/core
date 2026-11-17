import type { SimpleRouteJson, SimplifiedPcbTrace } from "./SimpleRouteJson"

type PcbTraceId = SimplifiedPcbTrace["pcb_trace_id"]

/** Retain authored copper geometry and mark it immutable for routing. */
export function withFixedTraces(
  input: SimpleRouteJson,
  fixedTraceIds: ReadonlySet<PcbTraceId>,
): SimpleRouteJson {
  if (fixedTraceIds.size === 0) return input
  return {
    ...input,
    traces: input.traces?.map((trace) => {
      if (!fixedTraceIds.has(trace.pcb_trace_id)) return trace
      return { ...trace, isFixed: true }
    }),
  }
}
