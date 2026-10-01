import type { SpiceEngine } from "@tscircuit/props"
import { coreSync, runCorePromise } from "lib/effect/core-error"
import { simulate, spiceyTranToVGraphs } from "spicey"

/** Pure spicey kernels execute inside the typed simulation boundary. */
export const simulateSpiceyEffect = (spiceString: string) =>
  coreSync(() => {
    const simulation_experiment_id = "spice-experiment-1"
    const { circuit: parsedCircuit, tran } = simulate(spiceString)
    const voltageGraphs = spiceyTranToVGraphs(
      tran,
      parsedCircuit,
      simulation_experiment_id,
    )
    return { simulationResultCircuitJson: voltageGraphs }
  }, "spicey_simulation")

export const getSpiceyEngine = (): SpiceEngine => {
  return {
    simulate: (spiceString: string) =>
      runCorePromise(simulateSpiceyEffect(spiceString)),
  }
}
