import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

test("detects different shape overlaps", () => {
  // Create test data with different shaped overlapping pads
  const testPads = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "CIRCLE_PAD",
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
      pcb_smtpad_id: "RECT_PAD",
      pcb_component_id: "comp2",
      pcb_port_id: "port2",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 0.2, // Overlaps with circle
      y: 0,
      subcircuit_id: "sub2", // Different subcircuit
    },
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect overlap between different shapes
  expect(errors.length).toBeGreaterThan(0)

  const overlapError = errors.find(
    (error) =>
      error.pad_ids.includes("CIRCLE_PAD") &&
      error.pad_ids.includes("RECT_PAD"),
  )
  expect(overlapError).toBeDefined()
})
