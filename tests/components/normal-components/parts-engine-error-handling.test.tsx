import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parts engine handles JSON parsing errors", async () => {
  const { circuit } = getTestFixture()

  // Mock parts engine that returns HTML instead of JSON (simulating Vercel error page)
  const mockPartsEngine = {
    findPart: async () => {
      return "<!DOCTYPE html><html><body>Internal Server Error</body></html>"
    },
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // Should return empty object instead of crashing
  expect(sourceComponent.supplier_part_numbers).toEqual({})

  // Should insert an error about the failure
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain("Failed to fetch supplier part numbers")
})

test("parts engine handles network errors", async () => {
  const { circuit } = getTestFixture()

  // Mock parts engine that throws an error
  const mockPartsEngine = {
    findPart: async () => {
      throw new Error("Network request failed")
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // Should return empty object instead of crashing
  expect(sourceComponent.supplier_part_numbers).toEqual({})

  // Should insert an error about the failure
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain("Network request failed")
})

test("parts engine handles invalid response format", async () => {
  const { circuit } = getTestFixture()

  // Mock parts engine that returns an invalid format (array instead of object)
  const mockPartsEngine = {
    findPart: async () => {
      return ["123-456", "789-012"]
    },
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // Should return empty object instead of crashing
  expect(sourceComponent.supplier_part_numbers).toEqual({})

  // Should insert an error about the invalid format
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain("Invalid supplier part numbers format")
})

test("parts engine still works with valid responses after error handling", async () => {
  const { circuit } = getTestFixture()

  // Mock parts engine that returns valid data
  const mockPartsEngine = {
    findPart: async () => ({
      digikey: ["123-456"],
      mouser: ["789-012"],
    }),
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // Should still work correctly with valid responses
  expect(sourceComponent.supplier_part_numbers).toEqual({
    digikey: ["123-456"],
    mouser: ["789-012"],
  })

  // Should not have any errors
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBe(0)
})

test('parts engine handles "Not found" response correctly', async () => {
  const { circuit } = getTestFixture()

  // Mock parts engine that returns "Not found"
  const mockPartsEngine = {
    findPart: async () => "Not found",
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // "Not found" should be converted to empty object
  expect(sourceComponent.supplier_part_numbers).toEqual({})

  // Should not insert any errors for "Not found" - it's a valid response
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors.length).toBe(0)
})
