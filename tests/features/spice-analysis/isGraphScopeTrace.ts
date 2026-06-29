import type {
  AnyCircuitElement,
  SimulationOscilloscopeTrace,
} from "circuit-json"

export const isGraphScopeTrace = (
  element: AnyCircuitElement,
): element is SimulationOscilloscopeTrace =>
  element.type === "simulation_oscilloscope_trace" &&
  Boolean(
    element.simulation_transient_voltage_graph_id ||
      element.simulation_transient_current_graph_id,
  )
