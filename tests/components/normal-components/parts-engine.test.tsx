import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parts engine modifies source component", async () => {
  const { circuit } = getTestFixture()

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
  expect(sourceComponent.supplier_part_numbers).toEqual({
    digikey: ["123-456"],
    mouser: ["789-012"],
  })
})

test("parts engine handles findPart returning undefined gracefully", async () => {
  const { circuit } = getTestFixture()
  const mockPartsEngine = { findPart: async () => undefined } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <resistor name="R2" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const sourceComponent = circuit.db.source_component
    .list()
    .find((c) => c.name === "R2")
  expect(sourceComponent).toBeTruthy()
  if (!sourceComponent)
    throw new Error("Test setup error: sourceComponent not found")
  if (sourceComponent.supplier_part_numbers === undefined)
    throw new Error("supplier_part_numbers is undefined")
  expect(sourceComponent.supplier_part_numbers).toEqual({})
  // Should not throw
  expect(() =>
    Object.values(sourceComponent.supplier_part_numbers!).map((x) => x),
  ).not.toThrow()
})
