import type { PcbTrace } from "circuit-json"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Converts an already-rendered PCB trace into the autorouter's simplified trace
 * shape so region rerouting can use existing imported routes as the baseline.
 */
export function convertPcbTraceToSimplifiedPcbTrace(
  trace: PcbTrace,
): SimplifiedPcbTrace {
  return {
    ...(trace as any),
    type: "pcb_trace",
    pcb_trace_id: trace.pcb_trace_id,
    connection_name:
      (trace as any).connection_name ??
      trace.source_trace_id ??
      trace.pcb_trace_id,
    route: trace.route.map((point) => ({ ...point })) as any,
  }
}
