import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { SOLVERS } from "lib/solvers"

const MINIMAL_SRJ = {
  layerCount: 2,
  obstacles: [],
  connections: [
    {
      name: "conn1",
      pointsToConnect: [
        { x: 0, y: 0, layer: "top" },
        { x: 1, y: 1, layer: "top" },
      ],
    },
  ],
} as any

test("autorouter v5 start() uses stepAsync when available", async () => {
  const originalSolver = SOLVERS.AutoroutingPipelineSolver5

  class FakeAsyncV5Solver {
    solved = false
    failed = false
    error: string | null = null
    iterations = 0
    progress = 0
    stepCalls = 0
    stepAsyncCalls = 0

    constructor() {}

    step() {
      this.stepCalls++
      this.iterations++
      this.failed = true
      this.error = "step() should not be used for v5 async solver"
    }

    async stepAsync() {
      this.stepAsyncCalls++
      await Promise.resolve()
      this.iterations++
      this.progress = 1
      this.solved = true
    }

    getCurrentPhase() {
      return "fake"
    }

    preview() {
      return undefined
    }

    getOutputSimpleRouteJson() {
      return {
        traces: [
          {
            type: "pcb_trace",
            route: [
              { x: 0, y: 0, route_type: "wire", width: 0.1, layer: "top" },
              { x: 1, y: 1, route_type: "wire", width: 0.1, layer: "top" },
            ],
          },
        ],
      }
    }
  }
  ;(SOLVERS as any).AutoroutingPipelineSolver5 = FakeAsyncV5Solver

  try {
    const autorouter = new TscircuitAutorouter(MINIMAL_SRJ, {
      autorouterVersion: "v5",
    })

    const result = await new Promise<{ traces: unknown[]; solver: any }>(
      (resolve, reject) => {
        autorouter.on("complete", (ev) => {
          resolve({ traces: ev.traces, solver: (autorouter as any).solver })
        })
        autorouter.on("error", (ev) => {
          reject(ev.error)
        })
        autorouter.start()
      },
    )

    expect(result.traces.length).toBe(1)
    expect(result.solver.stepAsyncCalls).toBeGreaterThan(0)
    expect(result.solver.stepCalls).toBe(0)
  } finally {
    ;(SOLVERS as any).AutoroutingPipelineSolver5 = originalSolver
  }
})
