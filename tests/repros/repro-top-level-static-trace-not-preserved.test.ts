import { expect, test } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import type { AnyCircuitElement } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/get-test-fixture"

test("top-level static PCB traces are preserved in autorouter input", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 12,
      height: 12,
      num_layers: 2,
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_fixed_left",
      name: "FIXED_LEFT",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_fixed_right",
      name: "FIXED_RIGHT",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_route_bottom",
      name: "ROUTE_BOTTOM",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_route_top",
      name: "ROUTE_TOP",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_fixed_left",
      source_port_id: "source_port_fixed_left",
      x: -4,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_fixed_right",
      source_port_id: "source_port_fixed_right",
      x: 4,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_route_bottom",
      source_port_id: "source_port_route_bottom",
      x: 0,
      y: -4,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_route_top",
      source_port_id: "source_port_route_top",
      x: 0,
      y: 4,
      layers: ["top"],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_fixed",
      connected_source_port_ids: [
        "source_port_fixed_left",
        "source_port_fixed_right",
      ],
      connected_source_net_ids: [],
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_to_route",
      connected_source_port_ids: [
        "source_port_route_bottom",
        "source_port_route_top",
      ],
      connected_source_net_ids: [],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_fixed",
      source_trace_id: "source_trace_fixed",
      route: [
        {
          route_type: "wire",
          x: -4,
          y: 0,
          width: 0.3,
          layer: "top",
          start_pcb_port_id: "pcb_port_fixed_left",
        },
        {
          route_type: "wire",
          x: 4,
          y: 0,
          width: 0.3,
          layer: "top",
          end_pcb_port_id: "pcb_port_fixed_right",
        },
      ],
    } as any,
  ]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })

  expect(simpleRouteJson.connections).toHaveLength(1)
  expect(simpleRouteJson.traces).toHaveLength(1)

  const { simpleRouteJson: freshRoutingInput } =
    getSimpleRouteJsonFromCircuitJson({
      circuitJson,
      ignoreExistingTopLevelPcbRouteState: true,
    })
  expect(freshRoutingInput.connections).toHaveLength(2)
  expect(freshRoutingInput.traces).toBeUndefined()

  const svg = getSvgFromGraphicsObject(
    convertSrjToGraphicsObject(simpleRouteJson as any),
    {
      backgroundColor: "#fff",
      hideInlineLabels: false,
      svgHeight: 600,
      svgWidth: 800,
    },
  )
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
