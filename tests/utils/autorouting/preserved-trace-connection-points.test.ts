import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getObstaclesFromSrjTraces } from "lib/utils/autorouting/getObstaclesFromSrjTraces"
import { getPreservedTraceConnectionPoints } from "lib/utils/autorouting/getPreservedRoutedSubcircuitTraces"

test("parent autorouting can attach to the closest point along child copper", () => {
  const preservedTrace: NonNullable<SimpleRouteJson["traces"]>[number] = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_child",
    connection_name: "source_trace_child",
    connectsTo: [],
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
      { route_type: "wire", x: 10, y: 0, width: 0.1, layer: "top" },
    ],
  }
  const childTracePoints = getPreservedTraceConnectionPoints(preservedTrace)
  preservedTrace.connectsTo = childTracePoints.map((point) => point.pointId)
  const preservedTraceObstacles = getObstaclesFromSrjTraces({
    traces: [preservedTrace],
    layerCount: 2,
    viaDiameter: 0.5,
  })

  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    bounds: { minX: -1, maxX: 11, minY: -1, maxY: 6 },
    obstacles: preservedTraceObstacles,
    connections: [
      {
        name: "source_trace_parent",
        externallyConnectedPointIds: [preservedTrace.connectsTo],
        pointsToConnect: [
          { x: 5, y: 5, layer: "top", pointId: "pcb_port_parent" },
          ...childTracePoints,
        ],
      },
    ],
  }

  const routedTraces = new TscircuitAutorouter(simpleRouteJson).solveSync()

  expect(routedTraces).toHaveLength(1)
  expect(routedTraces[0]?.connectsTo).toEqual([
    "pcb_port_parent",
    "pcb_trace_route_point_pcb_trace_child_10",
  ])
  expect(routedTraces[0]?.route).toEqual([
    { route_type: "wire", x: 5, y: 0, width: 0.1, layer: "top" },
    { route_type: "wire", x: 5, y: 5, width: 0.1, layer: "top" },
  ])
})
