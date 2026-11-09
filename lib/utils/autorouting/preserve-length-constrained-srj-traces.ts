import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import type { SimpleRouteJson } from "./SimpleRouteJson"

/**
 * Preserve completed, length- or width-constrained copper during later routing phases.
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
    // Later phases do not carry the earlier connection's length or width
    // requirement. Keep its completed copper so clearance repair cannot turn
    // a short bypass into a detour or shrink a power feed to signal width.
    const hasLengthConstraint = sourceTrace?.max_length !== undefined
    const hasWidthConstraint =
      sourceTrace?.min_trace_thickness !== undefined &&
      sourceTrace.min_trace_thickness > srj.minTraceWidth + 1e-6
    if (!hasLengthConstraint && !hasWidthConstraint) return trace
    return { ...trace, isFixed: true }
  }),
})
