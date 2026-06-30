import type { SimulationGraphWithSourceProbe } from "./InsertedSimulationGraph"

export const getGraphLevels = (graph: SimulationGraphWithSourceProbe) =>
  graph.type === "simulation_transient_current_graph"
    ? graph.current_levels
    : graph.voltage_levels
