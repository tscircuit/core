import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parts engine handles HTML error responses gracefully", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine = {
    findPart: async (): Promise<any> => {
      // Simulate receiving HTML error page instead of JSON (the main issue from the error log)
      return "<!DOCTYPE html><html><head><title>Error</title></head><body>Internal Server Error</body></html>"
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
    </board>,
  )

  // Should not throw an error and should handle gracefully
  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.list()[0]
  // Should fallback to empty object when HTML is returned instead of crashing
  expect(sourceComponent.supplier_part_numbers).toEqual({})
})
