import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parts engine handles errors gracefully and logs them to Circuit JSON", async () => {
  // Test 1: HTML error page
  const { circuit: circuit1 } = getTestFixture()
  const htmlMock = {
    findPart: async () =>
      "<!DOCTYPE html><html><body>Internal Server Error</body></html>",
  } as any

  circuit1.add(
    <board partsEngine={htmlMock} width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit1.renderUntilSettled()

  const sc1 = circuit1.db.source_component.list()[0]
  expect(sc1.supplier_part_numbers).toEqual({})
  const errors1 = circuit1.db.pcb_placement_error.list()
  expect(errors1.length).toBeGreaterThan(0)
  expect(errors1[0].message).toContain("Failed to fetch supplier part numbers")
  expect(errors1[0].message).toContain("<!DOCTYPE")

  // Test 2: Network failure
  const { circuit: circuit2 } = getTestFixture()
  const networkMock = {
    findPart: async () => {
      throw new Error("Network request failed")
    },
  }

  circuit2.add(
    <board partsEngine={networkMock} width="20mm" height="20mm">
      <resistor name="R2" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit2.renderUntilSettled()

  const sc2 = circuit2.db.source_component.list()[0]
  expect(sc2.supplier_part_numbers).toEqual({})
  const errors2 = circuit2.db.pcb_placement_error.list()
  expect(errors2.length).toBeGreaterThan(0)
  expect(errors2[0].message).toContain("Network request failed")

  // Test 3: Invalid format (array instead of object)
  const { circuit: circuit3 } = getTestFixture()
  const invalidMock = {
    findPart: async () => ["123-456", "789-012"],
  } as any

  circuit3.add(
    <board partsEngine={invalidMock} width="20mm" height="20mm">
      <resistor name="R3" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit3.renderUntilSettled()

  const sc3 = circuit3.db.source_component.list()[0]
  expect(sc3.supplier_part_numbers).toEqual({})
  const errors3 = circuit3.db.pcb_placement_error.list()
  expect(errors3.length).toBeGreaterThan(0)
  expect(errors3[0].message).toContain("Invalid supplier part numbers format")
})
