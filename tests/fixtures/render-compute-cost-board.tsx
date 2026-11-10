import type { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import type { AutoroutingEndEvent, AutoroutingProgressEvent } from "lib/events"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import {
  computeCostSummary,
  createComputeCostAutorouter,
} from "tests/fixtures/create-compute-cost-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const TwoResistorBoard = ({ autorouter }: { autorouter: any }) => (
  <board width={20} height={10} autorouter={autorouter}>
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
    <trace from="R1.1" to="R2.1" />
  </board>
)

/** Routes two resistors with a stub autorouter that reports computeCostSummary. */
export const renderStubComputeCostBoard = async ({
  emitProgress,
}: { emitProgress: boolean }) => {
  const { circuit } = getTestFixture()
  const progress: AutoroutingProgressEvent[] = []
  const ends: AutoroutingEndEvent[] = []
  circuit.on("autorouting:progress", (event) => progress.push(event))
  circuit.on("autorouting:end", (event) => ends.push(event))
  circuit.add(
    <TwoResistorBoard
      autorouter={{
        algorithmFn: createComputeCostAutorouter({ emitProgress }),
      }}
    />,
  )
  await circuit.renderUntilSettled()
  return { circuit, progress, ends }
}

/**
 * Routes two resistors with the real capacity mesh wrapper, whose solver is
 * given a getComputeCostSummary() when `measured`.
 */
export const renderCapacityMeshComputeCostBoard = async ({
  autorouterThreads,
  measured,
}: { autorouterThreads: number; measured: boolean }) => {
  const { circuit } = getTestFixture()
  const progress: AutoroutingProgressEvent[] = []
  circuit.on("autorouting:progress", (event) => progress.push(event))
  let autorouter: TscircuitAutorouter
  circuit.add(
    <TwoResistorBoard
      autorouter={{
        algorithmFn: async (input: any) => {
          autorouter = new TscircuitAutorouter(input, {
            platformConfig: { autorouterThreads },
          })
          const solver = (
            autorouter as unknown as {
              solver: AutoroutingPipelineSolver9_PreloadedTraceGraph
            }
          ).solver
          Object.assign(solver, {
            getComputeCostSummary: measured
              ? () => computeCostSummary
              : undefined,
          })
          if (autorouterThreads > 1) {
            // Keep a fast solve alive until the 250ms progress timer ticks.
            const firstProgress = new Promise<void>((resolve) => {
              autorouter.on("progress", () => resolve())
            })
            const solveAsync = solver.solveAsync.bind(solver)
            solver.solveAsync = async (runtime) => {
              await solveAsync(runtime)
              await firstProgress
            }
          }
          return autorouter
        },
      }}
    />,
  )
  await circuit.renderUntilSettled()
  return { circuit, progress, autorouter: autorouter! }
}
