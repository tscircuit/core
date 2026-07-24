import type { SpiceEngine } from "@tscircuit/props"
import { simulateToCircuitJson } from "spicey"

export const getSpiceyEngine = (): SpiceEngine => {
  return {
    async simulate(spiceString: string) {
      return {
        simulationResultCircuitJson: simulateToCircuitJson({
          spiceString,
          simulationExperimentId: "placeholder_simulation_experiment_id",
        }),
      }
    },
  }
}
