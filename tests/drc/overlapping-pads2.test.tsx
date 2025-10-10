import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

test("allows overlapping pads with same subcircuit_id", () => {
  // Create test data with overlapping pads that have the same subcircuit_id
  const testPads = [
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
      x: 0.3, // Overlaps with PAD1 but same subcircuit
      y: 0,
      subcircuit_id: "sub1", // Same subcircuit
    },
  ]

  const errors = checkOverlappingPads(testPads)

  // Should not detect overlap between pads with same subcircuit_id
  expect(errors.length).toBe(0)
})
