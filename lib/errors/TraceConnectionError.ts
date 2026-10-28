import { type TraceConnectionErrorData } from "./trace-connection-error-data"

export class TraceConnectionError extends Error {
  constructor(public readonly errorData: TraceConnectionErrorData) {
    super(errorData.message)
    this.name = "TraceConnectionError"
  }
}
