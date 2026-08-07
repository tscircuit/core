import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C connector text is aligned with the schematic box left edge", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C165948"] }),
    fetchPartCircuitJson: async ({ supplierPartNumber }) => {
      if (supplierPartNumber === "C165948") {
        return usbCC165948CircuitJson as AnyCircuitElement[]
      }
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector
        name="J_USB"
        manufacturerPartNumber="HRO-TYPE-C-31-M-12"
        standard="usb_c"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  const expectedLeftEdge =
    schematicComponent.center.x - schematicComponent.size.width / 2
  const schematicTextPositions = circuit.db.schematic_text
    .list()
    .map(({ position }) => position.x)

  expect(schematicTextPositions).toEqual([expectedLeftEdge, expectedLeftEdge])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
