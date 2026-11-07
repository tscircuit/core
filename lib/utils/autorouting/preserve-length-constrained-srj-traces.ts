import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimpleRouteJson } from "./SimpleRouteJson"

/**
 * Preserve completed, length-constrained copper during later routing phases.
 * Routes stay as exact board-world geometry in mm (+X right, +Y up), without
 * conversion to rectangular obstacles or any coordinate transformation.
 */
export const preserveLengthConstrainedSrjTraces = (
  srj: SimpleRouteJson,
  db: CircuitJsonUtilObjects,
): SimpleRouteJson => ({
  ...srj,
  traces: srj.traces?.map((trace) => {
    const sourceTraceId = getSourceTraceIdForRoutedTrace({ db, trace })
    const sourceTrace = sourceTraceId
      ? db.source_trace.get(sourceTraceId)
      : undefined
    // A later phase has no length constraint for an earlier connection. Keep
    // the route completed by that connection's own phase instead of allowing
    // unconstrained clearance repair to turn a short bypass into a long detour.
    if (sourceTrace?.max_length === undefined) return trace
    return { ...trace, isFixed: true }
  }),
})
