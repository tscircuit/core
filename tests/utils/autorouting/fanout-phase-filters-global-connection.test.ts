import { expect, test } from "bun:test"
import { connectionIsInRoutingPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"

test("fanout phases exclude the board-level connection for the same source trace", () => {
  const trace = new Trace({
    from: ".U1 > .pin1",
    to: ".U2 > .pin1",
  })
  trace.source_trace_id = "source_trace_216"
  const phasePlan = {
    routingPhaseIndex: null,
    routingPcbGroupId: "pcb_group_hdmi_fanout",
    routingPcbPortIds: new Set(["pcb_port_1", "pcb_port_2"]),
    routingBounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
    autorouter: "fanout",
    traces: [trace],
    nets: [],
  } as RoutingPhasePlan
  const groupConnection = {
    name: "breakout:pcb_breakout_point_20",
    source_trace_id: "source_trace_216",
    routingPcbGroupId: "pcb_group_hdmi_fanout",
    pointsToConnect: [],
  } as SimpleRouteConnection
  const boardConnection = {
    name: "source_trace_216",
    source_trace_id: "source_trace_216",
    pointsToConnect: [
      { x: 0, y: 0, layer: "top", pointId: "pcb_breakout_point_20" },
      { x: 10, y: 0, layer: "top", pointId: "pcb_breakout_point_10" },
    ],
  } as SimpleRouteConnection
  const internalConnection = {
    name: "source_trace_216",
    source_trace_id: "source_trace_216",
    pointsToConnect: [
      {
        x: 0,
        y: 0,
        layer: "top",
        pointId: "pcb_port_1",
        pcb_port_id: "pcb_port_1",
      },
      {
        x: 1,
        y: 0,
        layer: "top",
        pointId: "pcb_port_2",
        pcb_port_id: "pcb_port_2",
      },
    ],
  } as SimpleRouteConnection
  const breakoutHandoffConnection = {
    name: "source_trace_216",
    source_trace_id: "source_trace_216",
    pointsToConnect: [
      {
        x: 1,
        y: 0,
        layer: "top",
        pointId: "pcb_breakout_point_20",
      },
    ],
  } as SimpleRouteConnection

  expect(connectionIsInRoutingPhase(groupConnection, phasePlan)).toBe(true)
  expect(connectionIsInRoutingPhase(boardConnection, phasePlan)).toBe(false)
  expect(connectionIsInRoutingPhase(internalConnection, phasePlan)).toBe(true)
  expect(connectionIsInRoutingPhase(breakoutHandoffConnection, phasePlan)).toBe(
    false,
  )
  expect(
    connectionIsInRoutingPhase(internalConnection, {
      ...phasePlan,
      autorouter: "auto",
    }),
  ).toBe(true)
  expect(
    connectionIsInRoutingPhase(boardConnection, {
      ...phasePlan,
      autorouter: "auto",
    }),
  ).toBe(true)
})
