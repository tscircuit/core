import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("board simple route json ignores source traces already routed by child subcircuits", () => {
  const childSubcircuitId = "subcircuit_source_group_0"
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
    } as any,
    {
      type: "source_net",
      source_net_id: "source_net_child",
      name: "CHILD_NET",
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_a",
      name: "A",
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_b",
      name: "B",
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_c",
      name: "C",
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_board",
      name: "D",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_child_a",
      source_port_id: "source_port_child_a",
      x: -2,
      y: 0,
      layers: ["top"],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_child_b",
      source_port_id: "source_port_child_b",
      x: 0,
      y: 0,
      layers: ["top"],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_child_c",
      source_port_id: "source_port_child_c",
      x: 1,
      y: 0,
      layers: ["top"],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_board",
      source_port_id: "source_port_board",
      x: 3,
      y: 0,
      layers: ["top"],
    } as any,
    {
      // Already-routed child-internal intent. Board SRJ should preserve the
      // matching pcb_trace below and must not emit this as a new connection.
      type: "source_trace",
      source_trace_id: "source_trace_child_internal",
      connected_source_port_ids: ["source_port_child_a", "source_port_child_b"],
      connected_source_net_ids: ["source_net_child"],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      // Parent-level work. This crosses from the child subcircuit to a board
      // port, so board SRJ should keep it as a connection to be routed.
      type: "source_trace",
      source_trace_id: "source_trace_board_cross_boundary",
      connected_source_port_ids: ["source_port_child_c", "source_port_board"],
      connected_source_net_ids: [],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_peer_same_net",
      connected_source_port_ids: [],
      connected_source_net_ids: ["source_net_child"],
    } as any,
    {
      type: "pcb_breakout_point",
      pcb_breakout_point_id: "pcb_breakout_point_child_b",
      source_port_id: "source_port_child_b",
      source_trace_id: "source_trace_child_internal",
      subcircuit_id: childSubcircuitId,
      x: 0,
      y: 0,
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_child_internal",
      source_trace_id: "source_trace_child_internal",
      subcircuit_id: childSubcircuitId,
      route: [
        {
          route_type: "wire",
          x: -2,
          y: 0,
          width: 0.1,
          layer: "top",
          start_pcb_port_id: "pcb_port_child_a",
        },
        {
          route_type: "wire",
          x: 0,
          y: 0,
          width: 0.1,
          layer: "top",
          end_pcb_port_id: "pcb_port_child_b",
        },
      ],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })

  // Child-internal routing is already represented by `pcb_trace_child_internal`,
  // so board SRJ should preserve it in `traces` instead of re-routing the
  // source_trace as a board-level connection.
  expect(
    simpleRouteJson.connections.some(
      (connection) =>
        connection.source_trace_id === "source_trace_child_internal",
    ),
  ).toBe(false)
  expect(simpleRouteJson.traces?.map((trace) => trace.pcb_trace_id)).toEqual([
    "pcb_trace_child_internal",
  ])

  const preservedTrace = simpleRouteJson.traces?.[0]
  expect(preservedTrace?.connectsTo).toEqual([
    "pcb_port_child_a",
    "pcb_port_child_b",
  ])
  expect(preservedTrace?.route.at(-1)).toMatchObject({ x: 0, y: 0 })

  // The cross-boundary trace is still board-level routing intent, so it should
  // remain in `connections`.
  expect(
    simpleRouteJson.connections.some(
      (connection) =>
        connection.source_trace_id === "source_trace_board_cross_boundary",
    ),
  ).toBe(true)

  const routedPointIds = simpleRouteJson.connections
    .flatMap((connection) => connection.pointsToConnect)
    .map((point) => point.pointId)
    .filter(Boolean)

  expect(routedPointIds).not.toContain("pcb_port_child_a")
  expect(routedPointIds).not.toContain("pcb_port_child_b")
})
