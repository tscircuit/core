import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector usb_c with explicit footprint bypasses standard circuit-json flow", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector name="USB1" standard="usb_c" footprint="pinrow2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")

  expect(sourceComponent).toBeTruthy()
  expect(sourceComponent!.supplier_part_numbers).toEqual({
    jlcpcb: ["C165948"],
  })
  expect(circuit.db.unknown_error_finding_part.list().length).toBe(0)
  expect(circuit.db.pcb_missing_footprint_error.list().length).toBe(0)
})
