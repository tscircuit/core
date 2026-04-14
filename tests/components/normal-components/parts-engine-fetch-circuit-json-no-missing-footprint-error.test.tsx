import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector with standard='usb_c' should not emit pcb_missing_footprint_error when using parts engine circuit json flow", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }: any) => {
      if (
        sourceComponent.ftype === "simple_connector" &&
        sourceComponent.standard === "usb_c"
      ) {
        return { jlcpcb: ["C165948"] }
      }
      return {}
    },
    fetchPartCircuitJson: async ({
      supplierPartNumber,
    }: {
      supplierPartNumber?: string
      manufacturerPartNumber?: string
    }) => {
      if (supplierPartNumber === "C165948") {
        return usbCC165948CircuitJson as AnyCircuitElement[]
      }
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_missing_footprint_error.list().length).toBe(0)
  expect(circuit.db.pcb_smtpad.list().length).toBeGreaterThan(0)
})
