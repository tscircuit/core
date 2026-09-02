import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

test("Pipeline 9 returns each preloaded trace once", async () => {
  const preloadedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "preloaded-trace",
    connection_name: "PRELOADED",
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 1, y: 0, width: 0.2, layer: "top" },
    ],
  }
  const routedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "routed-trace",
    connection_name: "ROUTED",
    route: [
      { route_type: "wire", x: 0, y: 1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
    ],
  }
  const srj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    obstacles: [],
    connections: [],
    bounds: { minX: -1, maxX: 2, minY: -1, maxY: 2 },
    traces: [preloadedTrace],
  }
  const solvedPipeline = {
    solved: true,
    failed: false,
    error: null,
    solve() {},
    getOutputSimpleRouteJson: () => ({
      ...srj,
      traces: [preloadedTrace, preloadedTrace, routedTrace],
    }),
    getOutputSimplifiedPcbTraces: () => [preloadedTrace, routedTrace],
  }

  const synchronousAutorouter = new TscircuitAutorouter(srj)
  Reflect.set(synchronousAutorouter, "solver", solvedPipeline)
  Reflect.set(synchronousAutorouter, "usesPipeline9Output", true)
  expect(
    synchronousAutorouter.solveSync().map((trace) => trace.pcb_trace_id),
  ).toEqual(["preloaded-trace", "routed-trace"])

  const asynchronousAutorouter = new TscircuitAutorouter(srj)
  Reflect.set(asynchronousAutorouter, "solver", solvedPipeline)
  Reflect.set(asynchronousAutorouter, "usesPipeline9Output", true)
  const asynchronousTraces = await new Promise<SimplifiedPcbTrace[]>(
    (resolve, reject) => {
      asynchronousAutorouter.on("complete", (event) => resolve(event.traces))
      asynchronousAutorouter.on("error", (event) => reject(event.error))
      asynchronousAutorouter.start()
    },
  )
  expect(asynchronousTraces.map((trace) => trace.pcb_trace_id)).toEqual([
    "preloaded-trace",
    "routed-trace",
  ])
})
