import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("connector with standard='usb_c' fetches circuit json from parts engine", async () => {
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

  // Verify supplier part numbers were stored on the source component
  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()
  expect(sourceComponent!.supplier_part_numbers).toEqual({
    jlcpcb: ["C165948"],
  })
  expect((sourceComponent as any).standard).toBe("usb_c")

  const sourcePorts = circuit.db.source_port
    .list()
    .filter(
      (sp: any) =>
        sp.source_component_id === sourceComponent!.source_component_id,
    )
  const hasHint = (hint: string) =>
    sourcePorts.some((sp: any) => sp.port_hints?.includes(hint))

  // Standard USB-C pin labels should be derived from the fetched circuit json
  // and applied to the corresponding ports regardless of manufacturer pin
  // numbering.
  expect(hasHint("CC1")).toBe(true)
  expect(hasHint("CC2")).toBe(true)
  expect(hasHint("GND1")).toBe(true)
  expect(hasHint("GND2")).toBe(true)
  expect(hasHint("VBUS1")).toBe(true)
  expect(hasHint("VBUS2")).toBe(true)
  expect(hasHint("DM1")).toBe(true)
  expect(hasHint("DM2")).toBe(true)
  expect(hasHint("DP1")).toBe(true)
  expect(hasHint("DP2")).toBe(true)
  expect(hasHint("SBU1")).toBe(true)
  expect(hasHint("SBU2")).toBe(true)

  // Verify footprint pads were added from the fetched circuit JSON
  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
