import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("ignores unowned top-level copper while preserving footprint copper", () => {
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
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      layer: "top",
      rotation: 0,
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_unowned_imported_arc",
      route: [
        { route_type: "wire", x: -2, y: -2, width: 0.2, layer: "top" },
        { route_type: "wire", x: -1.9, y: -1.8, width: 0.2, layer: "top" },
      ],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_footprint_bridge",
      pcb_component_id: "pcb_component_0",
      route: [
        { route_type: "wire", x: -0.5, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 0.5, y: 0, width: 0.2, layer: "top" },
      ],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const obstacleConnectionIds = simpleRouteJson.obstacles.flatMap(
    (obstacle) => obstacle.connectedTo,
  )

  expect(obstacleConnectionIds).toContain("pcb_trace_footprint_bridge")
  expect(obstacleConnectionIds).not.toContain("pcb_trace_unowned_imported_arc")
})
