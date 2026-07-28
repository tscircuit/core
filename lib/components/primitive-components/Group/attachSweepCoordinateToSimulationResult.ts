import type {
  AnyCircuitElementInput,
  SimulationParameterSweepCoordinate,
} from "circuit-json"
import { isSimulationAnalysisResult } from "./isSimulationAnalysisResult"

export const attachSweepCoordinateToSimulationResult = ({
  simulationResult,
  simulationParameterSweepCoordinates,
}: {
  simulationResult: AnyCircuitElementInput
  simulationParameterSweepCoordinates?: SimulationParameterSweepCoordinate[]
}): AnyCircuitElementInput => {
  if (
    !simulationParameterSweepCoordinates?.length ||
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
  if (simulationParameterSweepCoordinates.length === 1) {
    simulationResultWithSweepCoordinate.simulation_parameter_sweep_coordinate =
      simulationParameterSweepCoordinates[0]
  } else {
    simulationResultWithSweepCoordinate.simulation_parameter_sweep_coordinates =
      simulationParameterSweepCoordinates
  }
  return simulationResultWithSweepCoordinate
}
