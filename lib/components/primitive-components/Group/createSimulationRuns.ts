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
  simulationParameterSweepCoordinates?: SimulationParameterSweepCoordinate[]
}

const createSimulationRun = ({
  circuitJson,
  simulationParameterSweepCoordinates,
}: {
  circuitJson: AnyCircuitElement[]
  simulationParameterSweepCoordinates?: SimulationParameterSweepCoordinate[]
}): SimulationRun => {
  const spiceNetlist = circuitJsonToSpice(circuitJson)
  return {
    spiceNetlist,
    spiceString: spiceNetlist.toSpiceString(),
    simulationParameterSweepCoordinates,
  }
}

export const createSimulationRuns = ({
  circuitJson,
  simulationExperimentId,
}: {
  circuitJson: AnyCircuitElement[]
  simulationExperimentId: SimulationExperimentId
}): SimulationRun[] => {
  const parameterSweeps = circuitJson.filter(
    (circuitElement): circuitElement is SimulationParameterSweep =>
      circuitElement.type === "simulation_parameter_sweep" &&
      circuitElement.simulation_experiment_id === simulationExperimentId,
  )
  if (parameterSweeps.length === 0) {
    return [createSimulationRun({ circuitJson })]
  }

  let sweepCoordinateSets: SimulationParameterSweepCoordinate[][] = [[]]
  for (const parameterSweep of parameterSweeps) {
    const runCount =
      sweepCoordinateSets.length * parameterSweep.parameter_values.length
    if (runCount > 1_000_000) {
      throw new Error(
        "Parameter sweep Cartesian product exceeds 1,000,000 runs",
      )
    }
    sweepCoordinateSets = sweepCoordinateSets.flatMap((coordinateSet) =>
      parameterSweep.parameter_values.map((parameterValue, sweepIndex) => [
        ...coordinateSet,
        {
          simulation_parameter_sweep_id:
            parameterSweep.simulation_parameter_sweep_id,
          sweep_index: sweepIndex,
          parameter_value: parameterValue,
          parameter_unit: parameterSweep.parameter_unit,
        },
      ]),
    )
  }

  return sweepCoordinateSets.map((simulationParameterSweepCoordinates) => {
    let sweptCircuitJson = circuitJson
    for (
      let parameterSweepIndex = 0;
      parameterSweepIndex < parameterSweeps.length;
      parameterSweepIndex++
    ) {
      const parameterSweep = parameterSweeps[parameterSweepIndex]
      const simulationParameterSweepCoordinate =
        simulationParameterSweepCoordinates[parameterSweepIndex]
      if (!parameterSweep || !simulationParameterSweepCoordinate) {
        throw new Error("Parameter sweep coordinate set is incomplete")
      }
      sweptCircuitJson = applyParameterSweepCoordinate({
        circuitJson: sweptCircuitJson,
        parameterSweep,
        simulationParameterSweepCoordinate,
      })
    }

    return createSimulationRun({
      circuitJson: sweptCircuitJson,
      simulationParameterSweepCoordinates,
    })
  })
}
