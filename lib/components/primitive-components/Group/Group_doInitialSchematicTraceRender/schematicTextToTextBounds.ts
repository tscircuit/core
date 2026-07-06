import type { SchematicText } from "circuit-json"
import { getSchematicTextBounds } from "./getSchematicTextBounds"
import type { TextBoxes } from "@tscircuit/schematic-trace-solver"
import { getBoundsCenter } from "@tscircuit/math-utils"

export function schematicTextToTextBox(text: SchematicText): TextBoxes | null {
  if (!text.text) return null

  const bounds = getSchematicTextBounds(text)
  return {
    chipId: text.schematic_component_id,
    center: getBoundsCenter(bounds),
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    text: text.text,
  }
}
