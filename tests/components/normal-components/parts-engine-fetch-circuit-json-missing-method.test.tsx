import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector usb_c without footprint emits warning when partsEngine.fetchPartCircuitJson is missing", async () => {
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

  expect(circuit.db.unknown_error_finding_part.list()).toHaveLength(0)
  const warnings = circuit.db.source_part_not_found_warning.list()
  expect(warnings.length).toBe(1)
  expect(warnings[0].message).toContain(
    "fetchPartCircuitJson is not configured",
  )
  expect(circuit.db.pcb_smtpad.list().length).toBe(0)
})
