import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import usbCC2765186CircuitJson from "tests/fixtures/assets/usb-c-C2765186.circuit.json"

test("standard usb_c connector keeps its supplierPartNumbers instead of searching", async () => {
  const { circuit } = getTestFixture()
  const fetchedPartNumbers: (string | undefined)[] = []
  let findPartCalls = 0
  const partsEngine: PartsEngine = {
    findPart: async () => {
      findPartCalls++
      return { jlcpcb: ["C165948"] }
    },
    fetchPartCircuitJson: async ({ supplierPartNumber }) => {
      fetchedPartNumbers.push(supplierPartNumber)
      if (supplierPartNumber === "C165948")
        return usbCC165948CircuitJson as AnyCircuitElement[]
      if (supplierPartNumber === "C2765186")
        return usbCC2765186CircuitJson as AnyCircuitElement[]
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={partsEngine} width="20mm" height="20mm">
      <connector
        name="USB1"
        standard="usb_c"
        supplierPartNumbers={{ jlcpcb: ["C2765186"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(findPartCalls).toBe(0)
  expect([...new Set(fetchedPartNumbers)]).toEqual(["C2765186"])
  expect(circuit.db.source_component.list()[0]!.supplier_part_numbers).toEqual({
    jlcpcb: ["C2765186"],
  })
  expect(circuit.db.pcb_smtpad.list().length).toBeGreaterThan(0)
})
