import { test, expect } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "../../../lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { su } from "@tscircuit/circuit-json-util"

test("getSimpleRouteJsonFromCircuitJson should include board outline when present", () => {
  const circuitJson: any[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
      outline: [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
        { x: -5, y: 5 },
      ],
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      center: { x: -2, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp2",
      center: { x: 2, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
    },
    {
      type: "source_trace",
      source_trace_id: "trace1",
      connected_source_port_ids: ["port1", "port2"],
    },
    {
      type: "source_port",
      source_port_id: "port1",
      source_component_id: "comp1",
    },
    {
      type: "source_port",
      source_port_id: "port2",
      source_component_id: "comp2",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port1",
      source_port_id: "port1",
      x: -2,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port2",
      source_port_id: "port2",
      x: 2,
      y: 0,
      layers: ["top"],
    },
  ]

  const db = su(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db,
    minTraceWidth: 0.1,
  })

  // Check that outline is included in the SimpleRouteJson
  expect(simpleRouteJson.outline).toBeDefined()
  expect(simpleRouteJson.outline).toEqual([
    { x: -5, y: -5 },
    { x: 5, y: -5 },
    { x: 5, y: 5 },
    { x: -5, y: 5 },
  ])
})
