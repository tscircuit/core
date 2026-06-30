import type {
  SimulationTransientCurrentGraph,
  SimulationTransientVoltageGraph,
} from "circuit-json"

export type SimulationGraphWithSourceProbe =
  | (SimulationTransientVoltageGraph & { source_probe_id?: string | null })
  | (SimulationTransientCurrentGraph & { source_probe_id?: string | null })

export type InsertedSimulationGraph =
  | {
      type: "voltage"
      graph: SimulationTransientVoltageGraph & {
        source_probe_id?: string | null
      }
    }
  | {
      type: "current"
      graph: SimulationTransientCurrentGraph & {
        source_probe_id?: string | null
      }
    }
