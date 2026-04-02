import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector usb_c without footprint emits error when partsEngine.fetchPartCircuitJson is missing", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.unknown_error_finding_part.list()
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain("fetchPartCircuitJson is not configured")
  expect(circuit.db.pcb_smtpad.list().length).toBe(0)
})
