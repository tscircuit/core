import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector with standard='usb_c' handles findPart returning 'Not found' without creating footprint", async () => {
  const { circuit } = getTestFixture()
  let fetchCalls = 0

  const mockPartsEngine: PartsEngine = {
    findPart: async () => "Not found",
    fetchPartCircuitJson: async () => {
      fetchCalls++
      return undefined
    },
  } as any

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()
  expect(sourceComponent!.supplier_part_numbers).toEqual({})

  expect(fetchCalls).toBe(0)
  expect(circuit.db.pcb_smtpad.list().length).toBe(0)
  expect(circuit.db.unknown_error_finding_part.list().length).toBe(0)

  const missingMfnWarnings = circuit
    .getCircuitJson()
    .filter(
      (el: any) =>
        el.type === "source_missing_manufacturer_part_number_warning",
    )
  expect(missingMfnWarnings).toHaveLength(1)
  expect((missingMfnWarnings[0] as any).source_component_id).toBe(
    sourceComponent!.source_component_id,
  )
  expect((missingMfnWarnings[0] as any).message).toContain(
    'has standard="usb_c" but no manufacturerPartNumber (mfn). Add mfn if you do not want the USB-C part to change in future.',
  )
})
