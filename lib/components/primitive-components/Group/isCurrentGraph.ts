import type { AnyCircuitElementInput } from "circuit-json"
import type { SimulationGraphWithSourceProbe } from "./InsertedSimulationGraph"

export const isCurrentGraph = (
  element: AnyCircuitElementInput,
): element is Extract<
  AnyCircuitElementInput,
  { type: "simulation_transient_current_graph" }
> &
  SimulationGraphWithSourceProbe =>
  element.type === "simulation_transient_current_graph"
