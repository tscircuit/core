import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/check-overlapping-pads"

test("overlapping pad error has correct structure", () => {
  // Create test data with overlapping pads
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
      x: 0.3,
      y: 0,
      subcircuit_id: "sub2",
    },
  ]

  const errors = checkOverlappingPads(testPads)

  expect(errors.length).toBeGreaterThan(0)

  const error = errors[0]

  // Check error structure
  expect(error.type).toBe("overlapping_pad_error")
  expect(error.pcb_overlapping_pad_error_id).toBeDefined()
  expect(error.message).toBeDefined()
  expect(error.pad_ids).toBeInstanceOf(Array)
  expect(error.pad_ids.length).toBe(2)
  expect(error.center).toBeDefined()
  expect(error.center?.x).toBeDefined()
  expect(error.center?.y).toBeDefined()
  expect(error.pcb_component_ids).toBeInstanceOf(Array)
  expect(error.pcb_port_ids).toBeInstanceOf(Array)
})
