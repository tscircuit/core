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

test("getSimpleRouteJsonFromCircuitJson should handle missing outline", () => {
  const circuitJson: any[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
      // No outline property
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      center: { x: -2, y: 0 },
      width: 1,
      height: 1,
      layer: "top",
    },
  ]

  const db = su(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db,
    minTraceWidth: 0.1,
  })

  // Check that outline is undefined when not present
  expect(simpleRouteJson.outline).toBeUndefined()
})

test("getSimpleRouteJsonFromCircuitJson should handle complex polygon outline", () => {
  const circuitJson: any[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 20,
      height: 15,
      num_layers: 4,
      outline: [
        // Complex L-shaped outline
        { x: -10, y: -7.5 },
        { x: 10, y: -7.5 },
        { x: 10, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 7.5 },
        { x: -10, y: 7.5 },
      ],
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
      x: -8,
      y: -5,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port2",
      source_port_id: "port2",
      x: 3,
      y: 5,
      layers: ["bottom"],
    },
  ]

  const db = su(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db,
    minTraceWidth: 0.15,
  })

  // Check that complex outline is correctly passed
  expect(simpleRouteJson.outline).toBeDefined()
  expect(simpleRouteJson.outline).toEqual([
    { x: -10, y: -7.5 },
    { x: 10, y: -7.5 },
    { x: 10, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 7.5 },
    { x: -10, y: 7.5 },
  ])

  // Verify other properties are correct for 4-layer board
  expect(simpleRouteJson.layerCount).toBe(4)
  expect(simpleRouteJson.minTraceWidth).toBe(0.15)
  expect(simpleRouteJson.connections).toBeDefined()
  expect(simpleRouteJson.connections.length).toBeGreaterThan(0)
})
