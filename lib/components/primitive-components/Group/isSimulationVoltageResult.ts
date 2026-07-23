import type {
  AnyCircuitElementInput,
  SimulationNonTransientVoltageAnalysisResultInput,
} from "circuit-json"

export const isSimulationVoltageResult = (
  circuitElement: AnyCircuitElementInput,
): circuitElement is SimulationNonTransientVoltageAnalysisResultInput =>
  circuitElement.type === "simulation_dc_operating_point_voltage" ||
  circuitElement.type === "simulation_dc_sweep_voltage_graph" ||
  circuitElement.type === "simulation_ac_sweep_voltage_graph"
