import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC2765186CircuitJson from "tests/fixtures/assets/usb-c-C2765186.circuit.json"

/**
 * When findPart returns no supplier part numbers, core falls back to calling
 * fetchPartCircuitJson with the manufacturerPartNumber directly.
 */
test("connector usb_c falls back to manufacturerPartNumber when findPart returns no supplier parts", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async () => {
      // No supplier part numbers available
      return {}
    },
    fetchPartCircuitJson: async ({
      supplierPartNumber,
      manufacturerPartNumber,
    }: {
      supplierPartNumber?: string
      manufacturerPartNumber?: string
    }) => {
      if (manufacturerPartNumber === "USB4135-GF-A") {
        return usbCC2765186CircuitJson as AnyCircuitElement[]
      }
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

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()
  expect((sourceComponent as any).standard).toBe("usb_c")

  const sourcePorts = circuit.db.source_port
    .list()
    .filter(
      (sp: any) =>
        sp.source_component_id === sourceComponent!.source_component_id,
    )
  const pin1Port = sourcePorts.find((sp: any) => sp.pin_number === 1)
  const pin2Port = sourcePorts.find((sp: any) => sp.pin_number === 2)
  const pin7Port = sourcePorts.find((sp: any) => sp.pin_number === 7)
  const pin13Port = sourcePorts.find((sp: any) => sp.pin_number === 13)

  expect(pin1Port?.port_hints).toContain("GND1")
  expect(pin2Port?.port_hints).toContain("VBUS1")
  expect(pin7Port?.port_hints).toContain("DM1")
  expect(pin7Port?.port_hints).toContain("DN1")
  expect(pin13Port?.port_hints).toContain("SHELL1")

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
