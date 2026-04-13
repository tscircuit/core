import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector usb_c derives standard pin labels without remapping pin numbers", async () => {
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

  const portByLabel = (label: string) =>
    sourcePorts.find((sp: any) => sp.port_hints?.includes(label))

  // DN1/DN2 from the raw JSON get canonicalized to DM1/DM2.
  expect(portByLabel("DM1")).toBeTruthy()
  expect(portByLabel("DM2")).toBeTruthy()

  // C165948 keeps these signals on pin13/pin15; resolution must not remap
  // manufacturer pin numbers.
  expect(portByLabel("GND1")?.pin_number).toBe(13)
  expect(portByLabel("VBUS1")?.pin_number).toBe(15)

  // Standard shell labels are resolved against the part's EH* mounting pins.
  expect(portByLabel("SHELL1")).toBeTruthy()
  expect(portByLabel("SHELL2")).toBeTruthy()
  expect(portByLabel("SHELL3")).toBeTruthy()
  expect(portByLabel("SHELL4")).toBeTruthy()
})
