import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbSx with footprint[src^='kicad:'] selector overrides kicad footprint silkscreen font size", async () => {
  const mockFootprintWithSilkscreen = [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      supplier_part_numbers: {},
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 1,
      height: 0.6,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      shape: "rect",
      x: -0.5,
      y: 0,
      width: 0.5,
      height: 0.6,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_0",
      shape: "rect",
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.6,
      layer: "top",
      port_hints: ["2"],
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "pcb_silkscreen_text_0",
      pcb_component_id: "pcb_component_0",
      text: "REF**",
      anchor_position: { x: 0, y: -1.17 },
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 1,
    },
  ]

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          return { footprintCircuitJson: mockFootprintWithSilkscreen }
        },
      },
    },
  })

  circuit.add(
    <board
      width="30mm"
      height="20mm"
      pcbSx={{
        "& footprint[src^='kicad:'] silkscreentext": {
          fontSize: "2mm",
        },
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:R_0402_1005Metric"
        pcbX={0}
        pcbY={-3}
      />
      <silkscreentext
        text="KiCad silkscreen text size change w/ pcbSx"
        pcbX={0}
        pcbY={3}
        anchorAlignment="center"
        fontSize="1mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // The kicad footprint's silkscreen text should use the pcbSx fontSize
  const kicadSilkscreenText = silkscreenTexts.find((text) => text.text === "R1")
  expect(kicadSilkscreenText?.font_size).toBe(2)

  // The standalone silkscreentext should keep its explicit fontSize (1mm)
  const standaloneSilkscreenText = silkscreenTexts.find(
    (text) => text.text === "KiCad silkscreen text size change w/ pcbSx",
  )
  expect(standaloneSilkscreenText?.font_size).toBe(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
