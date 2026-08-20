import { expect, test } from "bun:test"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Group_syncFanoutExitsWithGlobalConnections } from "lib/components/primitive-components/Group/Group_syncFanoutExitsWithGlobalConnections"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const routingPcbGroupId = "pcb_group_soc_breakout"
const sourceTraceId = "source_trace_ddr_d0"
const localConnectionName = "DDR_D0"

type TraceWithSourceTraceId = NonNullable<SimpleRouteJson["traces"]>[number] & {
  source_trace_id: string
}

const createSimpleRouteJson = (
  connections: SimpleRouteJson["connections"],
): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.1,
  obstacles: [],
  connections,
  bounds: { minX: -1, maxX: 10, minY: -1, maxY: 1 },
})

test("fanout handoff trace keeps its phase-local routing identity", () => {
  const padPoint = { x: 0, y: 0, layer: "top", pointId: "soc:A1" }
  const remotePoint = { x: 10, y: 0, layer: "top", pointId: "memory:D1" }
  const fanoutExitPoint = {
    x: 3,
    y: 0,
    layer: "top",
    pointId: "breakout:DDR_D0",
  }
  const fanoutInputSimpleRouteJson = createSimpleRouteJson([
    {
      name: localConnectionName,
      source_trace_id: sourceTraceId,
      routingPcbGroupId,
      pointsToConnect: [padPoint, remotePoint],
    },
  ])
  const fanoutTrace: TraceWithSourceTraceId = {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_fanout_ddr_d0",
    connection_name: localConnectionName,
    source_trace_id: sourceTraceId,
    connectsTo: ["soc:A1", "breakout:DDR_D0"],
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
      { route_type: "wire", x: 3, y: 0, width: 0.1, layer: "top" },
    ],
  }
  const fanoutOutputSimpleRouteJson: SimpleRouteJson = {
    ...createSimpleRouteJson([
      {
        name: localConnectionName,
        source_trace_id: sourceTraceId,
        routingPcbGroupId,
        pointsToConnect: [fanoutExitPoint, remotePoint],
      },
    ]),
    traces: [fanoutTrace],
  }
  const baseSimpleRouteJson = createSimpleRouteJson([
    {
      name: sourceTraceId,
      source_trace_id: sourceTraceId,
      pointsToConnect: [padPoint, remotePoint],
    },
  ])
  const routingPhasePlan: RoutingPhasePlan = {
    routingPhaseIndex: null,
    routingPcbGroupId,
    nets: [],
    traces: [],
  }

  const result = Group_syncFanoutExitsWithGlobalConnections({
    fanoutInputSimpleRouteJson,
    fanoutOutputSimpleRouteJson,
    baseSimpleRouteJson,
    routingPhasePlan,
  })

  const handoffTrace = result.downstreamSimpleRouteJson.traces?.[0]
  expect(handoffTrace?.connection_name).toBe(localConnectionName)
  expect(handoffTrace?.connectsTo).not.toContain(sourceTraceId)
  expect(
    result.baseSimpleRouteJson.connections[0]?.pointsToConnect[0],
  ).toMatchObject({ x: 3, y: 0, layer: "top", pointId: "soc:A1" })
})
