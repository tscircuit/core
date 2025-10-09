import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

test("detects multiple overlapping pairs", () => {
  // Create test data with multiple overlapping pairs
  const testPads = [
    // First overlapping pair
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "PAD1",
      pcb_component_id: "comp1",
      pcb_port_id: "port1",
      layer: "top",
      shape: "circle",
      radius: 0.5,
      x: 0,
      y: 0,
      subcircuit_id: "sub1",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "PAD2",
      pcb_component_id: "comp2",
      pcb_port_id: "port2",
      layer: "top",
      shape: "circle",
      radius: 0.5,
      x: 0.3,
      y: 0,
      subcircuit_id: "sub2",
    },
    // Second overlapping pair
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "PAD3",
      pcb_component_id: "comp3",
      pcb_port_id: "port3",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 5,
      y: 0,
      subcircuit_id: "sub3",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "PAD4",
      pcb_component_id: "comp4",
      pcb_port_id: "port4",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 5.3,
      y: 0,
      subcircuit_id: "sub4",
    },
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect both overlapping pairs
  expect(errors.length).toBe(2)

  const pair1Error = errors.find(
    (error) => error.pad_ids.includes("PAD1") && error.pad_ids.includes("PAD2"),
  )
  const pair2Error = errors.find(
    (error) => error.pad_ids.includes("PAD3") && error.pad_ids.includes("PAD4"),
  )

  expect(pair1Error).toBeDefined()
  expect(pair2Error).toBeDefined()
})
