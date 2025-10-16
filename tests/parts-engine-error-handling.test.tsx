import { it, expect } from "bun:test"
import { Circuit } from "../lib"
import * as circuitJson from "circuit-json"

it("should handle parts engine errors gracefully", () => {
  const circuit = new Circuit()

  // Add a resistor with an invalid footprint that should cause the footprinter to fail
  circuit.add(
    <resistor
      name="R1"
      footprint="invalid_footprint_string_that_will_fail"
      resistance="10k"
    />,
  )

  // The circuit should still be generated even with the error
  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeDefined()
  expect(Array.isArray(circuitJson)).toBe(true)

  // Check that an error was recorded in the circuit JSON
  const errorElements = circuitJson.filter(
    (elm) => elm.type === "source_failed_to_create_component_error",
  )
  expect(errorElements.length).toBeGreaterThan(0)

  // Verify the error message contains information about the footprint failure
  const errorElement = errorElements[0] as any
  expect(errorElement.message).toContain(
    "invalid_footprint_string_that_will_fail",
  )
})

it("should handle multiple parts engine errors gracefully", () => {
  const circuit = new Circuit()

  // Add multiple components with invalid footprints
  circuit.add(
    <resistor name="R1" footprint="invalid_footprint_1" resistance="10k" />,
  )

  circuit.add(
    <resistor name="R2" footprint="invalid_footprint_2" resistance="20k" />,
  )

  // Should handle multiple errors gracefully
  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeDefined()

  // Check that errors were recorded for both components
  const errorElements = circuitJson.filter(
    (elm) => elm.type === "source_failed_to_create_component_error",
  )
  expect(errorElements.length).toBe(2)

  // Verify both error messages contain footprint failure information
  errorElements.forEach((errorElement: any) => {
    expect(errorElement.message).toContain("invalid_footprint")
  })
})

it("should still process valid footprints correctly", () => {
  const circuit = new Circuit()

  // Add a component with a valid footprint
  circuit.add(<resistor name="R1" footprint="0402" resistance="10k" />)

  // Add a component with an invalid footprint
  circuit.add(
    <resistor name="R2" footprint="invalid_footprint" resistance="20k" />,
  )

  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeDefined()

  // Should have one error for the invalid footprint
  const errorElements = circuitJson.filter(
    (elm) => elm.type === "source_failed_to_create_component_error",
  )
  expect(errorElements.length).toBe(1)

  // Should still have the valid component processed
  const sourceComponents = circuitJson.filter(
    (elm) => elm.type === "source_component",
  )
  expect(sourceComponents.length).toBe(1) // Only the valid component should be in source
})
