import { spyOn } from "bun:test"
import type { FanoutSolver } from "@tscircuit/fanout-solver"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export const createSteppableFanoutAutorouter = (stepsToSolve = 2501) => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
  }
  const autorouter = new FanoutAutorouter(input, { mode: "fanout" })
  const solver = {
    solved: false,
    failed: false,
    error: undefined as string | undefined,
    iterations: 0,
    progress: 0,
    preparedBuses: [],
    step() {
      this.iterations++
      this.progress = this.iterations / stepsToSolve
      this.solved = this.iterations >= stepsToSolve
    },
    solve() {
      throw new Error("The asynchronous wrapper must use step()")
    },
    visualize: () => ({ points: [] }),
    preview: () => ({ points: [] }),
    getOutput: () => ({ simpleRouteJson: input, fanoutTraces: [] }),
  }
  spyOn(
    autorouter as unknown as { createFanoutSolver: () => FanoutSolver },
    "createFanoutSolver",
  ).mockReturnValue(solver as unknown as FanoutSolver)
  return { autorouter, solver }
}
