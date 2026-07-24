import type {
  AnyCircuitElementInput,
  SimulationNonTransientCurrentAnalysisResultInput,
} from "circuit-json"

export const isSimulationCurrentResult = (
  circuitElement: AnyCircuitElementInput,
): circuitElement is SimulationNonTransientCurrentAnalysisResultInput =>
  circuitElement.type === "simulation_dc_operating_point_current" ||
  circuitElement.type === "simulation_dc_sweep_current_graph" ||
  circuitElement.type === "simulation_ac_sweep_current_graph"
