import { expect, test } from "bun:test"
import type { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import type { AutoroutingProgressEvent } from "lib/events"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { routeEffort } from "tests/fixtures/createRouteEffortAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacity mesh forwards optional solver effort in stepped and threaded progress", async () => {
  for (const autorouterThreads of [1, 2]) {
    for (const measured of [true, false]) {
      const { circuit } = getTestFixture()
      const progress: AutoroutingProgressEvent[] = []
      circuit.on("autorouting:progress", (event) => progress.push(event))
      let autorouter: TscircuitAutorouter
      circuit.add(
        <board
          width={20}
          height={10}
          autorouter={{
            algorithmFn: async (input) => {
              autorouter = new TscircuitAutorouter(input, {
                platformConfig: { autorouterThreads },
              })
              const solver = (
                autorouter as unknown as {
                  solver: AutoroutingPipelineSolver9_PreloadedTraceGraph
                }
              ).solver
              Object.assign(solver, {
                getRouteEffortSummary: measured ? () => routeEffort : undefined,
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
        >
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
          <trace from="R1.1" to="R2.1" />
        </board>,
      )
      await circuit.renderUntilSettled()
      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(autorouter!.getRouteEffort()).toEqual(
        measured ? routeEffort : undefined,
      )
      expect(progress.length).toBeGreaterThan(0)
      for (const event of progress) {
        if (measured) expect(event.routeEffort).toEqual(routeEffort)
        else expect(event).not.toHaveProperty("routeEffort")
      }
    }
  }
})
