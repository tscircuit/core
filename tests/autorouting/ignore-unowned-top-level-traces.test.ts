import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("ignoreExistingTopLevelPcbRouteState omits unowned top-level traces but retains component-owned footprint copper", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board_1",
      center: { x: 0, y: 0 },
      width: 50,
      height: 50,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    // Top-level unowned trace (e.g. imported Altium diagonal arc/trace without source_trace_id or pcb_component_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "unowned_top_level_trace",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" }, // diagonal segment
      ],
    },
    // Component-owned footprint copper (e.g. solder-jumper bridge with pcb_component_id)
    {
      type: "pcb_trace",
      pcb_trace_id: "component_footprint_copper",
      pcb_component_id: "pcb_component_jumper",
      route: [
        { route_type: "wire", x: 5, y: 5, width: 0.2, layer: "top" },
        { route_type: "wire", x: 6, y: 5, width: 0.2, layer: "top" },
      ],
    },
    // Subcircuit-scoped trace
    {
      type: "pcb_trace",
      pcb_trace_id: "subcircuit_trace",
      subcircuit_id: "subcircuit_1",
      route: [
        { route_type: "wire", x: 10, y: 10, width: 0.2, layer: "top" },
        { route_type: "wire", x: 11, y: 10, width: 0.2, layer: "top" },
      ],
    },
  ]

  // With ignoreExistingTopLevelPcbRouteState: true:
  // - unowned diagonal top-level trace is omitted, so it doesn't throw and isn't in obstacles
  // - component-owned footprint copper and subcircuit copper are retained in obstacles
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })

  // Verify that the diagonal unowned top-level trace did not become an obstacle
  const allConnectedTo = simpleRouteJson.obstacles.flatMap(
    (o) => o.connectedTo ?? [],
  )
  expect(allConnectedTo).not.toContain("unowned_top_level_trace")
  expect(allConnectedTo).toContain("component_footprint_copper")
  expect(allConnectedTo).toContain("subcircuit_trace")

  // With ignoreExistingTopLevelPcbRouteState: false (default):
  // The unowned trace is not ignored, and attempting to generate obstacles from the diagonal route throws
  expect(() => {
    getSimpleRouteJsonFromCircuitJson({
      circuitJson,
      ignoreExistingTopLevelPcbRouteState: false,
    })
  }).toThrow(
    /getObstaclesFromTrace currently only supports horizontal and vertical traces/,
  )
})
