import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connector standard usb_c prefers user pinLabels over default usb_c labels", async () => {
  const { circuit } = getTestFixture()

  const mockCircuitJson = [
    {
      type: "pcb_smtpad",
      x: 0,
      y: 0,
      width: 0.3,
      height: 1,
      shape: "rect",
      layer: "top",
      port_hints: ["A1"],
      pcb_component_id: "U1",
    },
    {
      type: "pcb_smtpad",
      x: 1,
      y: 0,
      width: 0.3,
      height: 1,
      shape: "rect",
      layer: "top",
      port_hints: ["A5"],
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
    findPart: async () => ({ jlcpcb: ["C165948"] }),
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
      <connector
        name="USB1"
        standard="usb_c"
        pinLabels={{
          pin1: ["GND_CUSTOM", "A1"],
          pin6: ["CC_CUSTOM", "A5"],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()

  const usbPorts = circuit.db.source_port
    .list()
    .filter(
      (p: any) =>
        p.source_component_id === sourceComponent!.source_component_id,
    )

  const pin1 = usbPorts.find((p: any) => p.pin_number === 1)
  expect(pin1).toBeTruthy()
  expect(pin1?.name).toBe("GND_CUSTOM")
  const pin1Hints = pin1?.port_hints ?? []
  expect(pin1Hints).toContain("GND_CUSTOM")
  expect(pin1Hints).toContain("A1")
  expect(pin1Hints).not.toContain("GND1")

  const pin6 = usbPorts.find((p: any) => p.pin_number === 6)
  expect(pin6).toBeTruthy()
  expect(pin6?.name).toBe("CC_CUSTOM")
  const pin6Hints = pin6?.port_hints ?? []
  expect(pin6Hints).toContain("CC_CUSTOM")
  expect(pin6Hints).toContain("A5")
  expect(pin6Hints).not.toContain("CC1")

  expect(circuit.db.unknown_error_finding_part.list().length).toBe(0)
})
