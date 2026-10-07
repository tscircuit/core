import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { SchematicText } from "lib/components/primitive-components/SchematicText"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

test("createComponentsFromCircuitJson preserves schematic text parts", () => {
  const components = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0",
    },
    [
      {
        type: "schematic_text",
        schematic_text_id: "schematic_text_0",
        position: { x: 0, y: 0 },
        text: "FB/INT",
        text_parts: [{ text: "FB/" }, { text: "INT", is_overlined: true }],
        font_size: 0.5,
        anchor: "center",
        color: "#000000",
        rotation: 0,
      },
    ] as AnyCircuitElement[],
  )

  const schematicText = components.find(
    (component) => component instanceof SchematicText,
  ) as SchematicText | undefined

  expect(schematicText?._parsedProps.text).toEqual([
    { text: "FB/" },
    { text: "INT", overline: true },
  ])
})
