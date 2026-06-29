import type { AnyCircuitElementInput } from "circuit-json"
import type { SimulationGraphWithSourceProbe } from "./InsertedSimulationGraph"

export const isVoltageGraph = (
  element: AnyCircuitElementInput,
): element is Extract<
  AnyCircuitElementInput,
  { type: "simulation_transient_voltage_graph" }
> &
  SimulationGraphWithSourceProbe =>
  element.type === "simulation_transient_voltage_graph"
