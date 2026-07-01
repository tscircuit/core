import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("board simple route json ignores source traces already routed by child subcircuits", () => {
  const subcircuit_id = "subcircuit_source_group_0"
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
      subcircuit_id,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_a",
      name: "A",
      subcircuit_id,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_b",
      name: "B",
      subcircuit_id,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_child_c",
      name: "C",
      subcircuit_id,
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
      subcircuit_id,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_child_b",
      source_port_id: "source_port_child_b",
      x: 0,
      y: 0,
      layers: ["top"],
      subcircuit_id,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_child_c",
      source_port_id: "source_port_child_c",
      x: 1,
      y: 0,
      layers: ["top"],
      subcircuit_id,
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
      type: "source_trace",
      source_trace_id: "source_trace_child_internal",
      connected_source_port_ids: ["source_port_child_a", "source_port_child_b"],
      connected_source_net_ids: ["source_net_child"],
      subcircuit_id,
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_board_cross_boundary",
      connected_source_port_ids: ["source_port_child_c", "source_port_board"],
      connected_source_net_ids: [],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_child_internal",
      source_trace_id: "source_trace_child_internal",
      subcircuit_id,
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

  expect(
    simpleRouteJson.connections.some(
      (connection) =>
        connection.source_trace_id === "source_trace_child_internal",
    ),
  ).toBe(false)
  expect(
    simpleRouteJson.connections.some(
      (connection) =>
        connection.source_trace_id === "source_trace_board_cross_boundary",
    ),
  ).toBe(true)
  expect(simpleRouteJson.traces?.map((trace) => trace.pcb_trace_id)).toEqual([
    "pcb_trace_child_internal",
  ])

  const routedPointIds = simpleRouteJson.connections
    .flatMap((connection) => connection.pointsToConnect)
    .map((point) => point.pointId)
    .filter(Boolean)

  expect(routedPointIds).not.toContain("pcb_port_child_a")
  expect(routedPointIds).not.toContain("pcb_port_child_b")
})
