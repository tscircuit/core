import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbTrace } from "circuit-json"

const TRACE_WIDTH_COMPARISON_TOLERANCE_MM = 1e-6

export const insertTraceWidthError = (
  pcbTrace: PcbTrace,
  db: CircuitJsonUtilObjects,
): void => {
  if (!pcbTrace.source_trace_id) return
  const sourceTrace = db.source_trace.get(pcbTrace.source_trace_id)
  if (sourceTrace?.min_trace_thickness === undefined) return

  for (const point of pcbTrace.route) {
    if (point.route_type !== "wire") continue
    if (
      point.width >=
      sourceTrace.min_trace_thickness - TRACE_WIDTH_COMPARISON_TOLERANCE_MM
    ) {
      continue
    }

    db.pcb_trace_error.insert({
      error_type: "pcb_trace_error",
      message: `Routed trace width ${point.width} mm is below the requested minimum of ${sourceTrace.min_trace_thickness} mm.`,
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: sourceTrace.source_trace_id,
      subcircuit_id: pcbTrace.subcircuit_id,
      center: { x: point.x, y: point.y },
      pcb_component_ids: [],
      pcb_port_ids: [],
    })
    return
  }
}
