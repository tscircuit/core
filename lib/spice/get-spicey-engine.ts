import type { SpiceEngine } from "@tscircuit/props"
import type { SimulationExperiment } from "circuit-json"

export const getSpiceyEngine = (): SpiceEngine => {
  return {
    async simulate(spiceString: string) {
      const { simulate, spiceyTranToVGraphs } = await import("spicey")
      const simulation_experiment_id = "spice-experiment-1"

      // Add .tran directive before .END if not present
      let spiceNetlist = spiceString
      if (!spiceNetlist.includes(".tran")) {
        spiceNetlist = spiceNetlist.replace(/\.END/i, ".tran 1us 10ms\n.END")
      }

      // Run spicey simulation
      const { circuit: parsedCircuit, tran } = simulate(spiceNetlist)

      // Convert transient results to voltage graphs
      const voltageGraphs = spiceyTranToVGraphs(
        tran,
        parsedCircuit,
        simulation_experiment_id,
      )

      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_experiment",
            simulation_experiment_id,
          } as SimulationExperiment,
          ...voltageGraphs,
        ],
      }
    },
  }
}
