import type {
  AnyCircuitElement,
  SimulationParameterSweep,
  SimulationParameterSweepPoint,
} from "circuit-json"
import { type SpiceNetlist, circuitJsonToSpice } from "circuit-json-to-spice"
import { applyParameterSweepPoint } from "./applyParameterSweepPoint"

export interface SimulationRun {
  spiceNetlist: SpiceNetlist
  spiceString: string
  simulationParameterSweepPointId?: string
}

const createSimulationRun = ({
  circuitJson,
  simulationParameterSweepPointId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationParameterSweepPointId?: string
}): SimulationRun => {
  const spiceNetlist = circuitJsonToSpice(circuitJson)
  return {
    spiceNetlist,
    spiceString: spiceNetlist.toSpiceString(),
    simulationParameterSweepPointId,
  }
}

export const createSimulationRuns = ({
  circuitJson,
  simulationExperimentId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: string
}): SimulationRun[] => {
  const parameterSweep = circuitJson.find(
    (circuitElement): circuitElement is SimulationParameterSweep =>
      circuitElement.type === "simulation_parameter_sweep" &&
      circuitElement.simulation_experiment_id === simulationExperimentId,
  )
  if (!parameterSweep) {
    return [createSimulationRun({ circuitJson })]
  }

  return circuitJson
    .filter(
      (circuitElement): circuitElement is SimulationParameterSweepPoint =>
        circuitElement.type === "simulation_parameter_sweep_point" &&
        circuitElement.simulation_parameter_sweep_id ===
          parameterSweep.simulation_parameter_sweep_id,
    )
    .sort(
      (firstPoint, secondPoint) =>
        firstPoint.sweep_index - secondPoint.sweep_index,
    )
    .map((sweepPoint) => {
      return createSimulationRun({
        circuitJson: applyParameterSweepPoint({
          circuitJson,
          parameterSweep,
          parameterSweepCoordinate: sweepPoint.parameter_value,
          simulationParameterSweepPointId:
            sweepPoint.simulation_parameter_sweep_point_id,
        }),
        simulationParameterSweepPointId:
          sweepPoint.simulation_parameter_sweep_point_id,
      })
    })
}
