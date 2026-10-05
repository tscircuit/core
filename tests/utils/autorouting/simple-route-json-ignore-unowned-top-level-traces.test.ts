import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("simple route json ignores unowned top-level traces when ignoreExistingTopLevelPcbRouteState is true", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      num_layers: 2,
    } as any,
    {
      type: "source_net",
      source_net_id: "source_net_0",
      name: "N1",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_1",
      name: "P1",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_2",
      name: "P2",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      source_port_id: "source_port_1",
      x: -5,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_2",
      source_port_id: "source_port_2",
      x: 5,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1", "source_port_2"],
      connected_source_net_ids: ["source_net_0"],
    } as any,
    // Unowned top-level copper trace (e.g. imported Altium diagonal arc/segment without source_trace_id or pcb_component_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_unowned_arc",
      route: [
        {
          route_type: "wire",
          x: 0,
          y: 2,
          width: 0.2,
          layer: "top",
        },
        {
          route_type: "wire",
          x: 2,
          y: 4,
          width: 0.2,
          layer: "top",
        },
      ],
    } as any,
    // Component-owned footprint copper trace (such as a solder-jumper bridge)
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_jumper",
      source_component_id: "source_component_jumper",
      center: { x: -5, y: 5 },
      width: 2,
      height: 2,
      layer: "top",
      rotation: 0,
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_footprint_jumper",
      pcb_component_id: "pcb_component_jumper",
      route: [
        {
          route_type: "wire",
          x: -5,
          y: 5,
          width: 0.2,
          layer: "top",
        },
        {
          route_type: "wire",
          x: -4,
          y: 5,
          width: 0.2,
          layer: "top",
        },
      ],
    } as any,
  ]

  // With ignoreExistingTopLevelPcbRouteState: true
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })

  // Footprint jumper trace obstacle should be retained
  const jumperObstacle = simpleRouteJson.obstacles.find(
    (o) =>
      o.center &&
      Math.abs(o.center.x - -4.5) < 0.01 &&
      Math.abs(o.center.y - 5) < 0.01,
  )
  expect(jumperObstacle).toBeDefined()

  // Unowned top-level trace should NOT be included in obstacles
  const unownedTraceObstacle = simpleRouteJson.obstacles.find(
    (o) =>
      o.center &&
      Math.abs(o.center.x - 1) < 0.01 &&
      Math.abs(o.center.y - 3) < 0.01,
  )
  expect(unownedTraceObstacle).toBeUndefined()
})
