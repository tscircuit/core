import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getTraceLength } from "../Trace/trace-utils/compute-trace-length"

export const insertPcbTraceTooLongWarnings = ({
  db,
  subcircuitId,
}: {
  db: CircuitJsonUtilObjects
  subcircuitId: string
}) => {
  for (const warning of db.pcb_trace_too_long_warning.list()) {
    if (warning.subcircuit_id === subcircuitId) {
      db.pcb_trace_too_long_warning.delete(
        warning.pcb_trace_too_long_warning_id,
      )
    }
  }

  const pcbTraces = db.pcb_trace
    .list()
    .filter((pcbTrace) => pcbTrace.subcircuit_id === subcircuitId)

  for (const pcbTrace of pcbTraces) {
    if (!pcbTrace.source_trace_id) continue

    const sourceTrace = db.source_trace.get(pcbTrace.source_trace_id)
    const maximumTraceLength = sourceTrace?.max_length
    if (maximumTraceLength === undefined) continue

    const actualTraceLength =
      pcbTrace.trace_length ?? getTraceLength(pcbTrace.route)
    if (actualTraceLength <= maximumTraceLength) continue

    db.pcb_trace_too_long_warning.insert({
      warning_type: "pcb_trace_too_long_warning",
      message: `PCB trace is ${actualTraceLength.toFixed(2)}mm long, exceeding the ${maximumTraceLength}mm maximum`,
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: pcbTrace.source_trace_id,
      actual_trace_length: actualTraceLength,
      maximum_trace_length: maximumTraceLength,
      subcircuit_id: subcircuitId,
    })
  }
}
