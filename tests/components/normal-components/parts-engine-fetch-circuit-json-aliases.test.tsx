import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector usb_c adds DM aliases without remapping pin numbers or shell labels", async () => {
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
      <connector name="USB1" standard="usb_c" />
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

  const dn1Port = sourcePorts.find((sp: any) => sp.port_hints?.includes("DN1"))
  const dn2Port = sourcePorts.find((sp: any) => sp.port_hints?.includes("DN2"))
  const gnd1Port = sourcePorts.find((sp: any) =>
    sp.port_hints?.includes("GND1"),
  )
  const vbus1Port = sourcePorts.find((sp: any) =>
    sp.port_hints?.includes("VBUS1"),
  )

  expect(dn1Port?.port_hints).toContain("DM1")
  expect(dn2Port?.port_hints).toContain("DM2")

  // C165948 keeps these on pin13/pin15; normalization should not remap numbers.
  expect(gnd1Port?.pin_number).toBe(13)
  expect(vbus1Port?.pin_number).toBe(15)

  // We preserve EH labels as-is and do not canonicalize to SHELL*.
  expect(sourcePorts.some((sp: any) => sp.port_hints?.includes("EH1"))).toBe(
    true,
  )
  expect(sourcePorts.some((sp: any) => sp.port_hints?.includes("SHELL1"))).toBe(
    false,
  )
})
