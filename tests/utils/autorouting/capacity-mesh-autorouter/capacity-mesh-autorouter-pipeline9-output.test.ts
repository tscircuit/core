import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

test("Pipeline 9 local autorouter does not duplicate preloaded traces", () => {
  const preloadedTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "preloaded-trace",
    connection_name: "PRELOADED",
    route: [
      { route_type: "wire", x: -10, y: -4, width: 0.2, layer: "top" },
      { route_type: "wire", x: 10, y: -4, width: 0.2, layer: "top" },
    ],
  }
  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    obstacles: [],
    connections: [
      {
        name: "PRELOADED",
        pointsToConnect: [
          { x: -10, y: -4, layer: "top" },
          { x: 10, y: -4, layer: "top" },
        ],
      },
      {
        name: "ROUTED",
        pointsToConnect: [
          { x: -10, y: 4, layer: "top" },
          { x: 10, y: 4, layer: "top" },
        ],
      },
    ],
    bounds: { minX: -15, maxX: 15, minY: -10, maxY: 10 },
    traces: [preloadedTrace],
  }
  const autorouter = new TscircuitAutorouter(simpleRouteJson, {
    autorouterVersion: "beta_pipeline9",
  })

  const outputPcbTraces = autorouter.solveSync()

  expect(outputPcbTraces).toHaveLength(2)
  expect(outputPcbTraces.map((trace) => trace.connection_name).sort()).toEqual([
    "PRELOADED",
    "ROUTED",
  ])
  expect(new Set(outputPcbTraces.map((trace) => trace.pcb_trace_id)).size).toBe(
    outputPcbTraces.length,
  )
})
