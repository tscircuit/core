import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SimulationExperimentErrorCode } from "circuit-json"

const errorCodes = new Set<SimulationExperimentErrorCode>([
  "non_convergent",
  "timeout",
  "missing_model",
  "unsupported_analysis",
  "invalid_netlist",
  "engine_error",
])

const inferErrorCode = (message: string): SimulationExperimentErrorCode => {
  const normalized = message.toLowerCase()
  if (/timed?\s*out|timeout/.test(normalized)) return "timeout"
  if (
    /converg|timestep too small|iteration limit|singular matrix/.test(
      normalized,
    )
  ) {
    return "non_convergent"
  }
  if (/missing .*model|unknown subckt|unknown model/.test(normalized)) {
    return "missing_model"
  }
  if (/unsupported .*analysis/.test(normalized)) return "unsupported_analysis"
  if (/invalid netlist|syntax error|parse error/.test(normalized)) {
    return "invalid_netlist"
  }
  return "engine_error"
}

export const insertSimulationExperimentError = ({
  db,
  simulationExperimentId,
  error,
}: {
  db: CircuitJsonUtilObjects
  simulationExperimentId: string
  error: unknown
}) => {
  const errorObject =
    error && typeof error === "object"
      ? (error as {
          code?: unknown
          diagnostics?: unknown
          message?: unknown
        })
      : undefined
  const message =
    typeof errorObject?.message === "string"
      ? errorObject.message
      : error instanceof Error
        ? error.message
        : String(error)
  const explicitCode = errorObject?.code
  const errorCode =
    typeof explicitCode === "string" &&
    errorCodes.has(explicitCode as SimulationExperimentErrorCode)
      ? (explicitCode as SimulationExperimentErrorCode)
      : inferErrorCode(message)
  const rawDiagnostics = errorObject?.diagnostics
  const diagnostics = Array.isArray(rawDiagnostics)
    ? rawDiagnostics.filter((item): item is string => typeof item === "string")
    : typeof rawDiagnostics === "string"
      ? [rawDiagnostics]
      : undefined

  return db.simulation_experiment_error.insert({
    error_type: "simulation_experiment_error",
    simulation_experiment_id: simulationExperimentId,
    error_code: errorCode,
    message,
    diagnostics: diagnostics?.length ? diagnostics : undefined,
    is_fatal: true,
  })
}
