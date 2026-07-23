import type {
  AnyCircuitElement,
  SimulationExperiment,
  SimulationParameterSweep,
  SimulationParameterSweepCoordinate,
} from "circuit-json"
import { type SpiceNetlist, circuitJsonToSpice } from "circuit-json-to-spice"
import { applyParameterSweepCoordinate } from "./applyParameterSweepCoordinate"

type SimulationExperimentId = SimulationExperiment["simulation_experiment_id"]

export interface SimulationRun {
  spiceNetlist: SpiceNetlist
  spiceString: string
  simulationParameterSweepCoordinate?: SimulationParameterSweepCoordinate
}

const createSimulationRun = ({
  circuitJson,
  simulationParameterSweepCoordinate,
}: {
  circuitJson: AnyCircuitElement[]
  simulationParameterSweepCoordinate?: SimulationParameterSweepCoordinate
}): SimulationRun => {
  const spiceNetlist = circuitJsonToSpice(circuitJson)
  return {
    spiceNetlist,
    spiceString: spiceNetlist.toSpiceString(),
    simulationParameterSweepCoordinate,
  }
}

export const createSimulationRuns = ({
  circuitJson,
  simulationExperimentId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: SimulationExperimentId
}): SimulationRun[] => {
  const parameterSweep = circuitJson.find(
    (circuitElement): circuitElement is SimulationParameterSweep =>
      circuitElement.type === "simulation_parameter_sweep" &&
      circuitElement.simulation_experiment_id === simulationExperimentId,
  )
  if (!parameterSweep) {
    return [createSimulationRun({ circuitJson })]
  }

  return parameterSweep.parameter_values.map((parameterValue, sweepIndex) => {
    const simulationParameterSweepCoordinate: SimulationParameterSweepCoordinate =
      {
        simulation_parameter_sweep_id:
          parameterSweep.simulation_parameter_sweep_id,
        sweep_index: sweepIndex,
        parameter_value: parameterValue,
        parameter_unit: parameterSweep.parameter_unit,
      }
    return createSimulationRun({
      circuitJson: applyParameterSweepCoordinate({
        circuitJson,
        parameterSweep,
        simulationParameterSweepCoordinate,
      }),
      simulationParameterSweepCoordinate,
    })
  })
}
