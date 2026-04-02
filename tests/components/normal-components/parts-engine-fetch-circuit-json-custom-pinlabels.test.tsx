import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector usb_c applies custom pinLabels when footprint is fetched from parts engine", async () => {
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
    fetchPartCircuitJson: async ({ supplierPartNumber }: any) => {
      if (supplierPartNumber === "C165948") {
        return usbCC165948CircuitJson as AnyCircuitElement[]
      }
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={mockPartsEngine} width="20mm" height="20mm">
      <connector
        name="USB1"
        standard="usb_c"
        pinLabels={{
          pin1: "GND_CUSTOM",
          pin2: ["VBUS_CUSTOM", "VBUS_ALT"],
          pin13: "SHIELD_CUSTOM",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()

  const sourcePorts = circuit.db.source_port
    .list()
    .filter(
      (sp: any) =>
        sp.source_component_id === sourceComponent!.source_component_id,
    )
  const pin1Port = sourcePorts.find((sp: any) => sp.pin_number === 1)
  const pin2Port = sourcePorts.find((sp: any) => sp.pin_number === 2)
  const pin13Port = sourcePorts.find((sp: any) => sp.pin_number === 13)

  expect(pin1Port?.port_hints).toContain("GND_CUSTOM")
  expect(pin2Port?.port_hints).toContain("VBUS_CUSTOM")
  expect(pin2Port?.port_hints).toContain("VBUS_ALT")
  expect(pin13Port?.port_hints).toContain("SHIELD_CUSTOM")

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
