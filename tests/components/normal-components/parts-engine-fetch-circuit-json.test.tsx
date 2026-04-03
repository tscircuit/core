import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector with standard='usb_c' fetches circuit json from parts engine", async () => {
  const { circuit } = getTestFixture()

  const mockCircuitJson = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      x: 0,
      y: 0,
      width: 0.6,
      height: 0.6,
      shape: "rect",
      layer: "top",
      port_hints: ["1"],
      pcb_component_id: "U1",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      x: 1,
      y: 0,
      width: 0.6,
      height: 0.6,
      shape: "rect",
      layer: "top",
      port_hints: ["2"],
      pcb_component_id: "U1",
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "silk1",
      pcb_component_id: "U1",
      text: "USB",
      anchor_position: { x: 0.5, y: -1 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 1,
    },
  ]

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
        return mockCircuitJson as AnyCircuitElement[]
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

  // Verify footprint pads were added from the fetched circuit JSON
  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
