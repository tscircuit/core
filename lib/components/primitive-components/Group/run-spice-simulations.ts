import type { SpiceEngine, SpiceEngineSimulationResult } from "@tscircuit/props"
import type { SimulationRun } from "./createSimulationRuns"

const getSimulationConcurrency = ({
  maxConcurrentSimulations,
  simulationRunCount,
}: {
  maxConcurrentSimulations: number | undefined
  simulationRunCount: number
}) => {
  if (
    maxConcurrentSimulations === undefined ||
    !Number.isSafeInteger(maxConcurrentSimulations) ||
    maxConcurrentSimulations < 1
  ) {
    return 1
  }
  return Math.min(maxConcurrentSimulations, simulationRunCount)
}

export const runSpiceSimulations = async ({
  spiceEngine,
  simulationRuns,
}: {
  spiceEngine: SpiceEngine
  simulationRuns: SimulationRun[]
}): Promise<SpiceEngineSimulationResult[]> => {
  const simulationResults: SpiceEngineSimulationResult[] = new Array(
    simulationRuns.length,
  )
  const maxConcurrentSimulations =
    "maxConcurrentSimulations" in spiceEngine &&
    typeof spiceEngine.maxConcurrentSimulations === "number"
      ? spiceEngine.maxConcurrentSimulations
      : undefined
  const simulationConcurrency = getSimulationConcurrency({
    maxConcurrentSimulations,
    simulationRunCount: simulationRuns.length,
  })
  let nextSimulationRunIndex = 0

  await Promise.all(
    Array.from({ length: simulationConcurrency }, async () => {
      while (nextSimulationRunIndex < simulationRuns.length) {
        const simulationRunIndex = nextSimulationRunIndex++
        const simulationRun = simulationRuns[simulationRunIndex]
        if (!simulationRun) {
          throw new Error("SPICE simulation run is missing")
        }
        simulationResults[simulationRunIndex] = await spiceEngine.simulate(
          simulationRun.spiceString,
        )
      }
    }),
  )

  return simulationResults
}
