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
