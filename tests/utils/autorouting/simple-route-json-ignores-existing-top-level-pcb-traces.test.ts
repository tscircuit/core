import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("simple route json ignores existing top-level pcb traces as routing state", () => {
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
      source_net_id: "source_net_0",
      name: "N1",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_a",
      name: "A",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_b",
      name: "B",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_c",
      name: "C",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_a",
      source_port_id: "source_port_a",
      x: -2,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_b",
      source_port_id: "source_port_b",
      x: 0,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_c",
      source_port_id: "source_port_c",
      x: 2,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_ab",
      connected_source_port_ids: ["source_port_a", "source_port_b"],
      connected_source_net_ids: ["source_net_0"],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_bc",
      connected_source_port_ids: ["source_port_b", "source_port_c"],
      connected_source_net_ids: ["source_net_0"],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_existing_ab",
      source_trace_id: "source_trace_ab",
      route: [
        {
          route_type: "wire",
          x: -2,
          y: 0,
          width: 0.1,
          layer: "top",
          start_pcb_port_id: "pcb_port_a",
        },
        {
          route_type: "wire",
          x: 0,
          y: 0,
          width: 0.1,
          layer: "top",
          end_pcb_port_id: "pcb_port_b",
        },
      ],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })

  const netConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === "source_net_0",
  )

  expect(netConnection).toBeDefined()
  expect(netConnection!.pointsToConnect.map((p) => p.pointId)).toEqual([
    "pcb_port_a",
    "pcb_port_b",
    "pcb_port_c",
  ])
  expect(netConnection!.externallyConnectedPointIds).toBeUndefined()
  expect(simpleRouteJson.traces).toBeUndefined()
})

test("simple route json keeps existing pcb traces as routing state inside subcircuits", () => {
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
      source_net_id: "source_net_0",
      name: "N1",
      subcircuit_id,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_a",
      name: "A",
      subcircuit_id,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_b",
      name: "B",
      subcircuit_id,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_a",
      source_port_id: "source_port_a",
      x: -2,
      y: 0,
      layers: ["top"],
      subcircuit_id,
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_b",
      source_port_id: "source_port_b",
      x: 2,
      y: 0,
      layers: ["top"],
      subcircuit_id,
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_ab",
      connected_source_port_ids: ["source_port_a", "source_port_b"],
      connected_source_net_ids: ["source_net_0"],
      subcircuit_id,
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_existing_ab",
      source_trace_id: "source_trace_ab",
      subcircuit_id,
      route: [
        {
          route_type: "wire",
          x: -2,
          y: 0,
          width: 0.1,
          layer: "top",
          start_pcb_port_id: "pcb_port_a",
        },
        {
          route_type: "wire",
          x: 2,
          y: 0,
          width: 0.1,
          layer: "top",
          end_pcb_port_id: "pcb_port_b",
        },
      ],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id,
  })

  const netConnection = simpleRouteJson.connections.find(
    (connection) => connection.name === "source_net_0",
  )

  expect(netConnection).toBeDefined()
  expect(
    simpleRouteJson.connections.some(
      (connection) => connection.source_trace_id === "source_trace_ab",
    ),
  ).toBe(false)
  expect(netConnection!.externallyConnectedPointIds).toEqual([
    ["pcb_port_a", "pcb_port_b"],
  ])
})
