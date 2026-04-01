import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * When findPart returns no supplier part numbers, core falls back to calling
 * fetchPartCircuitJson with the manufacturerPartNumber directly.
 */
test("connector usb_c falls back to manufacturerPartNumber when findPart returns no supplier parts", async () => {
  const { circuit } = getTestFixture()

  const mockCircuitJson = [
    {
      type: "pcb_smtpad",
      x: 0,
      y: 0,
      width: 0.6,
      height: 0.6,
      shape: "rect",
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      x: 1,
      y: 0,
      width: 0.6,
      height: 0.6,
      shape: "rect",
      layer: "top",
      port_hints: ["2"],
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "silk1",
      text: "USB",
      anchor_position: { x: 0.5, y: -1 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 1,
    },
  ]

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
        return mockCircuitJson as AnyCircuitElement[]
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

  const pads = circuit.db.pcb_smtpad.list()
  expect(pads.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
