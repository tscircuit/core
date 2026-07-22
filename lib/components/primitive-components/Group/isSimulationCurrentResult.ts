import type { AnyCircuitElementInput } from "circuit-json"

export type SimulationCurrentResultInput = Extract<
  AnyCircuitElementInput,
  {
    type:
      | "simulation_dc_operating_point_current"
      | "simulation_dc_sweep_current_graph"
      | "simulation_ac_sweep_current_graph"
  }
>

export const isSimulationCurrentResult = (
  circuitElement: AnyCircuitElementInput,
): circuitElement is SimulationCurrentResultInput =>
  circuitElement.type === "simulation_dc_operating_point_current" ||
  circuitElement.type === "simulation_dc_sweep_current_graph" ||
  circuitElement.type === "simulation_ac_sweep_current_graph"
