import type {
  AnyCircuitElementInput,
  SimulationParameterSweepCoordinate,
} from "circuit-json"

export const attachSweepCoordinateToSimulationResult = ({
  simulationResult,
  simulationParameterSweepCoordinate,
}: {
  simulationResult: AnyCircuitElementInput
  simulationParameterSweepCoordinate?: SimulationParameterSweepCoordinate
}): AnyCircuitElementInput => {
  if (!simulationParameterSweepCoordinate) return simulationResult

  const coordinateSuffix = `${simulationParameterSweepCoordinate.simulation_parameter_sweep_id}_${simulationParameterSweepCoordinate.sweep_index}`

  switch (simulationResult.type) {
    case "simulation_transient_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_transient_voltage_graph_id
          ? {
              simulation_transient_voltage_graph_id: `${simulationResult.simulation_transient_voltage_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_transient_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_transient_current_graph_id
          ? {
              simulation_transient_current_graph_id: `${simulationResult.simulation_transient_current_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_dc_operating_point_voltage":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_operating_point_voltage_id
          ? {
              simulation_dc_operating_point_voltage_id: `${simulationResult.simulation_dc_operating_point_voltage_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_dc_operating_point_current":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_operating_point_current_id
          ? {
              simulation_dc_operating_point_current_id: `${simulationResult.simulation_dc_operating_point_current_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_dc_sweep_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_sweep_voltage_graph_id
          ? {
              simulation_dc_sweep_voltage_graph_id: `${simulationResult.simulation_dc_sweep_voltage_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_dc_sweep_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_sweep_current_graph_id
          ? {
              simulation_dc_sweep_current_graph_id: `${simulationResult.simulation_dc_sweep_current_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_ac_sweep_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_ac_sweep_voltage_graph_id
          ? {
              simulation_ac_sweep_voltage_graph_id: `${simulationResult.simulation_ac_sweep_voltage_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    case "simulation_ac_sweep_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_ac_sweep_current_graph_id
          ? {
              simulation_ac_sweep_current_graph_id: `${simulationResult.simulation_ac_sweep_current_graph_id}_${coordinateSuffix}`,
            }
          : {}),
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
      }
    default:
      return simulationResult
  }
}
