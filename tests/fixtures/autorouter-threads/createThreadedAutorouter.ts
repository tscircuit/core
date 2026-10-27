import { mock } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { AutorouterOptions } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { AutorouterRuntime } from "lib/utils/autorouting/create-autorouter-runtime"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export const threadTestInput: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [],
  connections: [
    {
      name: "signal",
      pointsToConnect: [
        { x: -1, y: 0, layer: "top" },
        { x: 1, y: 0, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
}

export function createThreadedAutorouter(
  options: AutorouterOptions = { platformConfig: { autorouterThreads: 4 } },
) {
  const autorouter = new TscircuitAutorouter(
    structuredClone(threadTestInput),
    options,
  )
  const solver = {
    solved: false,
    failed: false,
    error: null as string | null,
    iterations: 0,
    progress: 0,
    step: mock(() => {
      solver.iterations++
      solver.solved = true
    }),
    solve: mock(() => {
      solver.iterations++
      solver.solved = true
    }),
    solveAsync: mock(async (_runtime: AutorouterRuntime): Promise<void> => {
      solver.iterations++
      solver.solved = true
    }),
    getOutputSimplifiedPcbTraces: () => [],
    getCurrentPhase: () => "highDensityRouteSolver",
    preview: () => undefined,
  }
  ;(autorouter as unknown as { solver: typeof solver }).solver = solver
  return { autorouter, solver }
}
