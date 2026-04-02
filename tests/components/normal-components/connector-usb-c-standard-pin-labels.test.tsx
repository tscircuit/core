import { test, expect } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const USB_C_PORT_HINTS = [
  "A1",
  "B12",
  "A4",
  "B9",
  "B8",
  "A5",
  "B7",
  "A6",
  "A7",
  "B6",
  "A8",
  "B5",
  "A9",
  "B4",
  "A12",
  "B1",
]

test("connector standard usb_c exposes stable pin labels and aliases when footprint is fetched", async () => {
  const { circuit } = getTestFixture()

  const mockCircuitJson = [
    ...USB_C_PORT_HINTS.map((portHint, index) => ({
      type: "pcb_smtpad" as const,
      x: index * 0.5,
      y: 0,
      width: 0.3,
      height: 1,
      shape: "rect" as const,
      layer: "top" as const,
      port_hints: [portHint],
      pcb_component_id: "U1",
    })),
    {
      type: "pcb_silkscreen_text" as const,
      pcb_silkscreen_text_id: "silk1",
      pcb_component_id: "U1",
      text: "USB",
      anchor_position: { x: 0, y: -1 },
      anchor_alignment: "center" as const,
      layer: "top" as const,
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
      <connector name="USB1" standard="usb_c" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((c: any) => c.name === "USB1")
  expect(sourceComponent).toBeTruthy()
  const sourceComponentId = sourceComponent?.source_component_id
  expect(sourceComponentId).toBeTruthy()

  const usbPorts = circuit.db.source_port
    .list()
    .filter((p: any) => p.source_component_id === sourceComponentId)
  expect(usbPorts.length).toBeGreaterThanOrEqual(16)

  const pin1 = usbPorts.find((p: any) => p.pin_number === 1)
  expect(pin1).toBeTruthy()
  expect(pin1?.name).toBe("pin1")
  const pin1Hints = pin1?.port_hints ?? []
  expect(pin1Hints).toContain("GND1")
  expect(pin1Hints).toContain("A1")

  const pin6 = usbPorts.find((p: any) => p.pin_number === 6)
  expect(pin6).toBeTruthy()
  expect(pin6?.name).toBe("pin6")
  const pin6Hints = pin6?.port_hints ?? []
  expect(pin6Hints).toContain("CC1")
  expect(pin6Hints).toContain("A5")

  expect(circuit.db.unknown_error_finding_part.list().length).toBe(0)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
