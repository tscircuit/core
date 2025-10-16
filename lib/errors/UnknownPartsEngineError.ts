export interface UnknownPartsEngineErrorData {
  error_type: "unknown_parts_engine_error"
  message: string
  subcircuit_id?: string
  source_component_id?: string
  details?: string
}

export class UnknownPartsEngineError extends Error {
  constructor(public readonly errorData: UnknownPartsEngineErrorData) {
    super(errorData.message)
    this.name = "UnknownPartsEngineError"
  }
}
