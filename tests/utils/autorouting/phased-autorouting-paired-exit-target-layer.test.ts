import { expect, test } from "bun:test"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("phased fanout preserves the paired endpoint layer as an exit target", () => {
  const localFanoutConnectionName = "local_fanout_connection"
  const sourceTraceId = "source_trace_data_0"
  const sharedBreakoutPoint = {
    x: 2,
    y: 1,
    layer: "inner1",
    pointId: "breakout_point_data_0",
  }
  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    obstacles: [],
    connections: [
      {
        name: localFanoutConnectionName,
        routingPcbGroupId: "pcb_group_local_fanout",
        source_trace_id: sourceTraceId,
        pointsToConnect: [
          { x: 0, y: 0, layer: "top", pointId: "local_pad_data_0" },
          sharedBreakoutPoint,
        ],
      },
      {
        name: "global_connection",
        source_trace_id: sourceTraceId,
        pointsToConnect: [
          sharedBreakoutPoint,
          {
            x: 12,
            y: 3,
            layer: "inner2",
            pointId: "remote_breakout_point_data_0",
          },
        ],
      },
    ],
    buses: [
      {
        busId: "data_bus",
        connectionNames: [localFanoutConnectionName],
      },
    ],
    bounds: { minX: -1, maxX: 13, minY: -1, maxY: 4 },
  }
  const localFanoutPhase: RoutingPhasePlan = {
    routingPhaseIndex: 0,
    routingPcbGroupId: "pcb_group_local_fanout",
    traces: [],
    nets: [],
  }

  const phaseInput = Group_filterSimpleRouteJsonForPhase(
    simpleRouteJson,
    localFanoutPhase,
  )

  expect(phaseInput.buses?.[0]?.connectionExitTargets).toEqual({
    [localFanoutConnectionName]: { x: 12, y: 3, layer: "inner2" },
  })
})
