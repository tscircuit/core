import type { AnyCircuitElementInput } from "circuit-json"

export type SimulationVoltageResultInput = Extract<
  AnyCircuitElementInput,
  {
    type:
      | "simulation_dc_operating_point_voltage"
      | "simulation_dc_sweep_voltage_graph"
      | "simulation_ac_sweep_voltage_graph"
  }
>

export const isSimulationVoltageResult = (
  circuitElement: AnyCircuitElementInput,
): circuitElement is SimulationVoltageResultInput =>
  circuitElement.type === "simulation_dc_operating_point_voltage" ||
  circuitElement.type === "simulation_dc_sweep_voltage_graph" ||
  circuitElement.type === "simulation_ac_sweep_voltage_graph"
