import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("ignoreExistingTopLevelPcbRouteState omits unowned top-level traces while retaining component-owned footprint copper", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_jumper",
      source_component_id: "source_component_jumper",
      center: { x: 0, y: 0 },
      width: 2,
      height: 1,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_footprint_bridge",
      pcb_component_id: "pcb_component_jumper",
      route: [
        { route_type: "wire", x: -0.5, y: 0, width: 0.25, layer: "top" },
        { route_type: "wire", x: 0.5, y: 0, width: 0.25, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_unowned_top_level_arc",
      route: [
        { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
        { route_type: "wire", x: 3.5, y: 4.2, width: 0.2, layer: "top" },
      ],
    },
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })

  expect(
    simpleRouteJson.obstacles.some((obstacle) =>
      obstacle.connectedTo.includes("pcb_trace_footprint_bridge"),
    ),
  ).toBe(true)
  expect(
    simpleRouteJson.obstacles.some((obstacle) =>
      obstacle.connectedTo.includes("pcb_trace_unowned_top_level_arc"),
    ),
  ).toBe(false)
})
