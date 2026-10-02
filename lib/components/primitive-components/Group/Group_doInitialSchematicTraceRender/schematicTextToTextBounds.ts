import { getBoundsCenter } from "@tscircuit/math-utils"
import type { TextBoxes } from "@tscircuit/schematic-trace-solver"
import type { SchematicText } from "circuit-json"
import { getSchematicTextBounds } from "./getSchematicTextBounds"

/** Text rectangle in schematic world mm (+X right, +Y up), independent of the body. */
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
