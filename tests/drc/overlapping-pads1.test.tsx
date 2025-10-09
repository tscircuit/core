import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

/**
 * Test for checking overlapping SMT pads
 *
 * This test verifies that the DRC correctly detects overlapping pads
 * while allowing pads with the same subcircuit_id to overlap
 */
test("detects overlapping SMT pads", () => {
  // Create test data with overlapping SMT pads
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
      x: 0.3, // Overlaps with PAD1
      y: 0,
      subcircuit_id: "sub2", // Different subcircuit
    },
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
      x: 7, // No overlap with PAD3
      y: 0,
      subcircuit_id: "sub4",
    },
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect overlap between PAD1 and PAD2
  expect(errors.length).toBeGreaterThan(0)

  const overlapError = errors.find(
    (error) => error.pad_ids.includes("PAD1") && error.pad_ids.includes("PAD2"),
  )
  expect(overlapError).toBeDefined()
  expect(overlapError?.message).toContain("PAD1")
  expect(overlapError?.message).toContain("PAD2")
  expect(overlapError?.message).toContain("overlapping")
})
