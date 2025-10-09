import { test, expect } from "bun:test"
import { checkOverlappingPads } from "../../lib/utils/drc/checkOverlappingPads"

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
    }
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect overlap between PAD1 and PAD2
  expect(errors.length).toBeGreaterThan(0)
  
  const overlapError = errors.find(error => 
    error.pad_ids.includes("PAD1") && error.pad_ids.includes("PAD2")
  )
  expect(overlapError).toBeDefined()
  expect(overlapError?.message).toContain("PAD1")
  expect(overlapError?.message).toContain("PAD2")
  expect(overlapError?.message).toContain("overlapping")
})

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
    }
  ]

  const errors = checkOverlappingPads(testPads)

  // Should not detect overlap between pads with same subcircuit_id
  expect(errors.length).toBe(0)
})

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
    }
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect overlap between different shapes
  expect(errors.length).toBeGreaterThan(0)
  
  const overlapError = errors.find(error => 
    error.pad_ids.includes("CIRCLE_PAD") && error.pad_ids.includes("RECT_PAD")
  )
  expect(overlapError).toBeDefined()
})

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
    }
  ]

  const errors = checkOverlappingPads(testPads)

  // Should not detect overlap between pads on different layers
  expect(errors.length).toBe(0)
})

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
    }
  ]

  const errors = checkOverlappingPads(testPads)

  // Should detect both overlapping pairs
  expect(errors.length).toBe(2)
  
  const pair1Error = errors.find(error => 
    error.pad_ids.includes("PAD1") && error.pad_ids.includes("PAD2")
  )
  const pair2Error = errors.find(error => 
    error.pad_ids.includes("PAD3") && error.pad_ids.includes("PAD4")
  )
  
  expect(pair1Error).toBeDefined()
  expect(pair2Error).toBeDefined()
})

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
    }
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
