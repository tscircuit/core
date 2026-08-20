import { expect, test } from "bun:test"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("fanout autorouter re-emits a trace already present in its input", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    nominalTraceWidth: 0.1,
    minViaPadDiameter: 0.25,
    minViaHoleDiameter: 0.15,
    minTraceToPadEdgeClearance: 0.1,
    minViaEdgeToPadEdgeClearance: 0.1,
    defaultObstacleMargin: 0.1,
    bounds: { minX: -1, maxX: 3, minY: -1, maxY: 1 },
    obstacles: [
      {
        obstacleId: "soc-pad-a1",
        componentId: "soc",
        type: "rect",
        center: { x: 0, y: 0 },
        width: 0.3,
        height: 0.3,
        layers: ["top"],
        connectedTo: ["DDR_D0", "soc:A1"],
      },
    ],
    connections: [
      {
        name: "DDR_D0",
        source_trace_id: "source_trace_ddr_d0",
        pointsToConnect: [
          {
            x: 0,
            y: 0,
            layer: "top",
            pointId: "soc:A1",
            pcb_port_id: "soc:A1",
          },
          { x: 3, y: 0, layer: "top" },
        ],
      },
    ],
    buses: [{ busId: "DDR", connectionNames: ["DDR_D0"] }],
  }
  const options = {
    mode: "fanout" as const,
    fanoutBounds: { minX: -0.5, maxX: 2, minY: -0.8, maxY: 0.8 },
    fanoutRoutingLayers: ["top", "bottom"],
  }
  const firstAutorouter = new FanoutAutorouter(input, options)
  const firstFanoutTraces = firstAutorouter.solveSync()
  expect(firstFanoutTraces).toHaveLength(1)

  const secondAutorouter = new FanoutAutorouter(
    { ...input, traces: firstFanoutTraces },
    options,
  )
  const secondFanoutTraces = secondAutorouter.solveSync()

  expect(secondFanoutTraces).toHaveLength(1)
  expect(secondFanoutTraces[0]!.pcb_trace_id).toBe(
    firstFanoutTraces[0]!.pcb_trace_id,
  )
})
