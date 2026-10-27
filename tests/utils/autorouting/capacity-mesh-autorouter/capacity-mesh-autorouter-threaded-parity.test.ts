import { expect, spyOn, test } from "bun:test"
import { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import * as bunRuntime from "@tscircuit/capacity-autorouter/runtime/bun"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const input: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [],
  connections: [
    {
      name: "signal_a",
      pointsToConnect: [
        { x: -3, y: -1, layer: "top" },
        { x: 3, y: -1, layer: "top" },
      ],
    },
    {
      name: "signal_b",
      pointsToConnect: [
        { x: -3, y: 1, layer: "top" },
        { x: 3, y: 1, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
}

test("configured routing workers preserve synchronous output and are disposed on completion", async () => {
  const options = { platformConfig: { autorouterThreads: 2 } }
  const synchronous = new TscircuitAutorouter(structuredClone(input), options)
  const expectedTraces = synchronous.solveSync()
  const createRuntime = bunRuntime.createAutorouterSolverRuntime
  const disposals: Array<ReturnType<typeof spyOn>> = []
  const dispatches: Array<ReturnType<typeof spyOn>> = []
  const runtimeFactory = spyOn(
    bunRuntime,
    "createAutorouterSolverRuntime",
  ).mockImplementation((runtimeOptions) => {
    const runtime = createRuntime(runtimeOptions)
    disposals.push(spyOn(runtime, "dispose"))
    dispatches.push(spyOn(runtime, "executeAsync"))
    return runtime
  })
  const solveAsync = spyOn(
    AutoroutingPipelineSolver9_PreloadedTraceGraph.prototype,
    "solveAsync",
  )
  try {
    const threaded = new TscircuitAutorouter(structuredClone(input), options)
    const traces = await new Promise<ReturnType<typeof synchronous.solveSync>>(
      (resolve, reject) => {
        threaded.on("complete", (event) => resolve(event.traces))
        threaded.on("error", (event) => reject(event.error))
        threaded.start()
      },
    )
    expect(runtimeFactory).toHaveBeenCalledTimes(1)
    expect(runtimeFactory).toHaveBeenCalledWith({
      workerCount: 2,
      requireWorker: true,
    })
    expect(solveAsync).toHaveBeenCalledTimes(1)
    expect(solveAsync.mock.calls[0]).toHaveLength(1)
    expect(dispatches).toHaveLength(1)
    expect(dispatches[0]!.mock.calls.length).toBeGreaterThan(0)
    expect(disposals).toHaveLength(1)
    expect(disposals[0]).toHaveBeenCalledTimes(1)
    expect(threaded.isRouting).toBe(false)
    expect(traces).toEqual(expectedTraces)
    const synchronousSolver = (
      synchronous as unknown as {
        solver: AutoroutingPipelineSolver9_PreloadedTraceGraph
      }
    ).solver
    const threadedSolver = (
      threaded as unknown as {
        solver: AutoroutingPipelineSolver9_PreloadedTraceGraph
      }
    ).solver
    expect(threadedSolver.getOutputSimpleRouteJson()).toEqual(
      synchronousSolver.getOutputSimpleRouteJson(),
    )
    expect(threadedSolver.iterations).toBe(synchronousSolver.iterations)
    expect(threadedSolver.highDensityRouteSolver!.stats).toEqual(
      synchronousSolver.highDensityRouteSolver!.stats,
    )
  } finally {
    runtimeFactory.mockRestore()
    solveAsync.mockRestore()
    for (const dispose of disposals) dispose.mockRestore()
    for (const dispatch of dispatches) dispatch.mockRestore()
  }
})
