import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbStyle.silkscreenFontSize should override kicad footprint silkscreen font size", async () => {
  let capturedOptions: any = null

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
        kicad: async (footprintName: string, options?: any) => {
          capturedOptions = options
          // Create circuit JSON with silkscreen that should be overridden
          const footprintCircuitJson = mockFootprintWithSilkscreen.map((el) => {
            // Override silkscreen font size if resolvedPcbStyle is provided
            if (
              el.type === "pcb_silkscreen_text" &&
              options?.resolvedPcbStyle?.silkscreenFontSize
            ) {
              return {
                ...el,
                font_size: options.resolvedPcbStyle.silkscreenFontSize,
              }
            }
            return el
          })
          return { footprintCircuitJson }
        },
      },
    },
  })

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      pcbStyle={{
        silkscreenFontSize: 2,
      }}
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:R_0402_1005Metric"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify that resolvedPcbStyle was passed to the footprint loader
  expect(capturedOptions).toBeDefined()
  expect(capturedOptions?.resolvedPcbStyle?.silkscreenFontSize).toBe(2)

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  for (const text of silkscreenTexts) {
    expect(text.font_size).toBe(2.2)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
