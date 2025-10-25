import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parts engine processes valid responses and special cases correctly", async () => {
  // Test 1: Valid supplier part numbers
  const { circuit: circuit1 } = getTestFixture()
  const validMock = {
    findPart: async () => ({
      digikey: ["123-456"],
      mouser: ["789-012"],
    }),
  }

  circuit1.add(
    <board partsEngine={validMock} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit1.renderUntilSettled()

  const sc1 = circuit1.db.source_component.list()[0]
  expect(sc1.supplier_part_numbers).toEqual({
    digikey: ["123-456"],
    mouser: ["789-012"],
  })
  const errors1 = circuit1.db.unknown_error_finding_part.list()
  expect(errors1.length).toBe(0)

  // Test 2: "Not found" response (valid, converts to empty object)
  const { circuit: circuit2 } = getTestFixture()
  const notFoundMock = {
    findPart: async () => "Not found",
  } as any

  circuit2.add(
    <board partsEngine={notFoundMock} width="20mm" height="20mm">
      <resistor name="R2" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit2.renderUntilSettled()

  const sc2 = circuit2.db.source_component.list()[0]
  expect(sc2.supplier_part_numbers).toEqual({})
  const errors2 = circuit2.db.unknown_error_finding_part.list()
  expect(errors2.length).toBe(0)
})
