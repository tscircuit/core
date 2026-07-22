import type { AnyCircuitElementInput } from "circuit-json"

export const attachSweepPointToSimulationResult = ({
  simulationResult,
  simulationParameterSweepPointId,
}: {
  simulationResult: AnyCircuitElementInput
  simulationParameterSweepPointId?: string
}): AnyCircuitElementInput => {
  if (!simulationParameterSweepPointId) return simulationResult

  switch (simulationResult.type) {
    case "simulation_transient_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_transient_voltage_graph_id
          ? {
              simulation_transient_voltage_graph_id: `${simulationResult.simulation_transient_voltage_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_transient_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_transient_current_graph_id
          ? {
              simulation_transient_current_graph_id: `${simulationResult.simulation_transient_current_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_dc_operating_point_voltage":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_operating_point_voltage_id
          ? {
              simulation_dc_operating_point_voltage_id: `${simulationResult.simulation_dc_operating_point_voltage_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_dc_operating_point_current":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_operating_point_current_id
          ? {
              simulation_dc_operating_point_current_id: `${simulationResult.simulation_dc_operating_point_current_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_dc_sweep_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_sweep_voltage_graph_id
          ? {
              simulation_dc_sweep_voltage_graph_id: `${simulationResult.simulation_dc_sweep_voltage_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_dc_sweep_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_dc_sweep_current_graph_id
          ? {
              simulation_dc_sweep_current_graph_id: `${simulationResult.simulation_dc_sweep_current_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_ac_sweep_voltage_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_ac_sweep_voltage_graph_id
          ? {
              simulation_ac_sweep_voltage_graph_id: `${simulationResult.simulation_ac_sweep_voltage_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    case "simulation_ac_sweep_current_graph":
      return {
        ...simulationResult,
        ...(simulationResult.simulation_ac_sweep_current_graph_id
          ? {
              simulation_ac_sweep_current_graph_id: `${simulationResult.simulation_ac_sweep_current_graph_id}_${simulationParameterSweepPointId}`,
            }
          : {}),
        simulation_parameter_sweep_point_id: simulationParameterSweepPointId,
      }
    default:
      return simulationResult
  }
}
