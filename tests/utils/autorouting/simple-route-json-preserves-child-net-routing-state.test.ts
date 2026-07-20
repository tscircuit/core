import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("board simple route json preserves child trace physical connectivity", () => {
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
      source_net_id: "source_net_shared",
      name: "SHARED",
    } as any,
    ...[
      ["source_port_child_a", childSubcircuitId],
      ["source_port_child_b", childSubcircuitId],
      ["source_port_board", undefined],
    ].map(
      ([source_port_id, subcircuit_id]) =>
        ({
          type: "source_port",
          source_port_id,
          name: source_port_id,
          subcircuit_id,
        }) as any,
    ),
    ...[
      ["pcb_port_child_a", "source_port_child_a", -2, childSubcircuitId],
      ["pcb_port_child_b", "source_port_child_b", 0, childSubcircuitId],
      ["pcb_port_board", "source_port_board", 3, undefined],
    ].map(
      ([pcb_port_id, source_port_id, x, subcircuit_id]) =>
        ({
          type: "pcb_port",
          pcb_port_id,
          source_port_id,
          x,
          y: 0,
          layers: ["top"],
          subcircuit_id,
        }) as any,
    ),
    {
      type: "source_trace",
      source_trace_id: "source_trace_child_routed",
      connected_source_port_ids: ["source_port_child_a", "source_port_child_b"],
      connected_source_net_ids: ["source_net_shared"],
      subcircuit_id: childSubcircuitId,
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_board_net_intent",
      connected_source_port_ids: [
        "source_port_child_a",
        "source_port_child_b",
        "source_port_board",
      ],
      connected_source_net_ids: ["source_net_shared"],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_child_routed",
      source_trace_id: "source_trace_child_routed",
      subcircuit_id: childSubcircuitId,
      connectsTo: ["pcb_port_child_a", "pcb_port_child_b"],
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

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const netConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === "source_net_shared",
  )

  expect(netConnection?.pointsToConnect.map((point) => point.pointId)).toEqual([
    "pcb_port_child_a",
    "pcb_port_child_b",
    "pcb_port_board",
  ])
  expect(simpleRouteJson.traces).toEqual([
    expect.objectContaining({
      pcb_trace_id: "pcb_trace_child_routed",
      connectsTo: ["pcb_port_child_a", "pcb_port_child_b"],
    }),
  ])
})
