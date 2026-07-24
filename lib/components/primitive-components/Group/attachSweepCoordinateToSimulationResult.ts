import type {
  AnyCircuitElementInput,
  SimulationParameterSweepCoordinate,
} from "circuit-json"
import { isSimulationAnalysisResult } from "./isSimulationAnalysisResult"

export const attachSweepCoordinateToSimulationResult = ({
  simulationResult,
  simulationParameterSweepCoordinate,
}: {
  simulationResult: AnyCircuitElementInput
  simulationParameterSweepCoordinate?: SimulationParameterSweepCoordinate
}): AnyCircuitElementInput => {
  if (
    !simulationParameterSweepCoordinate ||
    !isSimulationAnalysisResult(simulationResult)
  ) {
    return simulationResult
  }

  const simulationResultWithSweepCoordinate = { ...simulationResult }
  const simulationResultIdKey = `${simulationResultWithSweepCoordinate.type}_id`
  Reflect.deleteProperty(
    simulationResultWithSweepCoordinate,
    simulationResultIdKey,
  )
  simulationResultWithSweepCoordinate.simulation_parameter_sweep_coordinate =
    simulationParameterSweepCoordinate
  return simulationResultWithSweepCoordinate
}
