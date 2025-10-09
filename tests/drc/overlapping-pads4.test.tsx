import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

test("ignores pads on different layers", () => {
  // Create test data with overlapping pads on different layers
  const testPads = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "TOP_PAD",
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
      pcb_smtpad_id: "BOTTOM_PAD",
      pcb_component_id: "comp2",
      pcb_port_id: "port2",
      layer: "bottom",
      shape: "circle",
      radius: 0.5,
      x: 0, // Same position but different layer
      y: 0,
      subcircuit_id: "sub2",
    },
  ]

  const errors = checkOverlappingPads(testPads)

  // Should not detect overlap between pads on different layers
  expect(errors.length).toBe(0)
})
