import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector usb_c leaves footprint empty when supplier and manufacturer circuit json are not found", async () => {
  const { circuit } = getTestFixture()
  const calls: Array<{
    supplierPartNumber?: string
    manufacturerPartNumber?: string
  }> = []

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: async ({
      supplierPartNumber,
      manufacturerPartNumber,
    }: {
      supplierPartNumber?: string
      manufacturerPartNumber?: string
    }) => {
      calls.push({ supplierPartNumber, manufacturerPartNumber })
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector
        name="USB1"
        standard="usb_c"
        manufacturerPartNumber="USB4135-GF-A"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(calls).toEqual([
    { supplierPartNumber: "C165948", manufacturerPartNumber: undefined },
    { supplierPartNumber: undefined, manufacturerPartNumber: "USB4135-GF-A" },
  ])

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()
  expect(sourceComponent!.supplier_part_numbers).toEqual({
    jlcpcb: ["C165948"],
  })

  expect(circuit.db.pcb_smtpad.list().length).toBe(0)
  expect(circuit.db.unknown_error_finding_part.list().length).toBe(0)
})
