import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

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
      footprinterString: "headermodule14_silkscreenlabel(XIAO RP2040)",
    },
    [importedSilkscreenText(text)],
  ).find((candidate) => candidate instanceof SilkscreenText) as
    | SilkscreenText
    | undefined

  return component?._parsedProps.text
}

test("preserves literal footprinter silkscreen labels", () => {
  expect(getImportedText("XIAO RP2040")).toBe("XIAO RP2040")
})

test("resolves footprinter reference placeholders to the component name", () => {
  expect(getImportedText("{REF}")).toBe("U1")
})
