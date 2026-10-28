export interface TraceConnectionErrorData {
  error_type: "source_trace_not_connected_error"
  message: string
  subcircuit_id?: string
  source_group_id?: string
  source_trace_id?: string
  selectors_not_found: string[]
}
