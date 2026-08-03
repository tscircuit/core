import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { AnyCircuitElement } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const HEADER_MODULE_FOOTPRINT =
  "headermodule14_rows2_p2.54mm_py15.24mm_female_silkscreenborder_silkscreenlabel(XIAO RP2040)"

const XIAO_PCB_PIN_LABELS = {
  pin1: "5V",
  pin2: "D0",
  pin3: "D1",
  pin4: "D2",
  pin5: "D3",
  pin6: "D4",
  pin7: "D5",
  pin8: "D6",
  pin9: "D7",
  pin10: "D8",
  pin11: "D9",
  pin12: "D10",
  pin13: "3V3",
  pin14: "GND",
} as const

const importedSilkscreenText = (text: string) =>
  ({
    type: "pcb_silkscreen_text",
    pcb_silkscreen_text_id: `silkscreen_${text}`,
    font: "tscircuit2024",
    font_size: 0.8,
    pcb_component_id: "pcb_component_1",
    text,
    layer: "top",
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
  }) as AnyCircuitElement

const getImportedText = (text: string) => {
  const component = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
      footprinterString: HEADER_MODULE_FOOTPRINT,
      pcbPinLabels: XIAO_PCB_PIN_LABELS,
    },
    [importedSilkscreenText(text)],
  ).find((candidate) => candidate instanceof SilkscreenText) as
    | SilkscreenText
    | undefined

  return component?._parsedProps.text
}

test("preserves literal footprinter silkscreen labels", async () => {
  expect(getImportedText("XIAO RP2040")).toBe("XIAO RP2040")

  const { circuit } = getTestFixture()
  const footprint = new Footprint({})
  const importedComponents = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
      footprinterString: HEADER_MODULE_FOOTPRINT,
      pcbPinLabels: XIAO_PCB_PIN_LABELS,
    },
    fp.string(HEADER_MODULE_FOOTPRINT).circuitJson(),
  )

  for (const component of importedComponents) {
    footprint.add(component)
  }

  circuit.add(
    <board width="24mm" height="24mm">
      <chip name="U1" layer="top" footprint={footprint as any} />
    </board>,
  )
  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("resolves footprinter reference placeholders to the component name", () => {
  expect(getImportedText("{REF}")).toBe("U1")
  expect(getImportedText("{PIN1}")).toBe("5V")
})
