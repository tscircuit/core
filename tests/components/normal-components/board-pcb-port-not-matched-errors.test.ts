import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getPcbPortNotMatchedErrors } from "lib/components/normal-components/board-get-pcb-port-not-matched-errors"

const createCircuitJson = (): AnyCircuitElement[] => [
  {
    type: "source_component",
    source_component_id: "source_component_1",
    ftype: "simple_chip",
    name: "U1",
    supplier_part_numbers: {},
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    source_component_id: "source_component_1",
    name: "EP",
    pin_number: 9,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_1",
    source_component_id: "source_component_1",
    center: { x: 0, y: 0 },
    width: 2,
    height: 2,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: false,
  },
]

test("missing PCB ports are reported only for connected, successfully footprinted source ports", () => {
  const unconnectedCircuitJson = createCircuitJson()
  expect(getPcbPortNotMatchedErrors(unconnectedCircuitJson)).toEqual([])

  const connectedCircuitJson = createCircuitJson()
  connectedCircuitJson.push({
    type: "source_trace",
    source_trace_id: "source_trace_1",
    connected_source_port_ids: ["source_port_1"],
    connected_source_net_ids: ["source_net_1"],
  })
  expect(getPcbPortNotMatchedErrors(connectedCircuitJson)).toHaveLength(1)

  connectedCircuitJson.push({
    type: "pcb_missing_footprint_error",
    pcb_missing_footprint_error_id: "pcb_missing_footprint_error_1",
    error_type: "pcb_missing_footprint_error",
    message: "No footprint specified for U1.",
    source_component_id: "source_component_1",
  })
  expect(getPcbPortNotMatchedErrors(connectedCircuitJson)).toEqual([])
})
