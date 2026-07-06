import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
import type { TextBoxes } from "@tscircuit/schematic-trace-solver"
import type {
  SchematicComponent,
  SchematicText,
  SourceComponentBase,
} from "circuit-json"
import { getSchematicTextBounds } from "./getSchematicTextBounds"

type SchematicTextToTextBoxOptions = {
  schematicComponent?: SchematicComponent
  sourceComponent?: SourceComponentBase | null
}

function isReferenceDesignatorText(
  text: SchematicText,
  sourceComponent?: SourceComponentBase | null,
) {
  if (!sourceComponent) return false
  return (
    text.text === sourceComponent.display_name ||
    text.text === sourceComponent.name
  )
}

export function schematicTextToTextBox(
  text: SchematicText,
  options: SchematicTextToTextBoxOptions = {},
): TextBoxes | null {
  if (!text.text) return null

  const bounds = getSchematicTextBounds(text)
  if (
    isReferenceDesignatorText(text, options.sourceComponent) &&
    options.schematicComponent?.center &&
    options.schematicComponent?.size
  ) {
    const componentBounds = getBoundFromCenteredRect({
      center: options.schematicComponent.center,
      width: options.schematicComponent.size.width,
      height: options.schematicComponent.size.height,
    })
    const textHeight = bounds.maxY - bounds.minY
    if (bounds.minY > componentBounds.maxY) {
      bounds.minY = componentBounds.maxY
      bounds.maxY = componentBounds.maxY + textHeight
    }
  }

  return {
    chipId: text.schematic_component_id,
    center: getBoundsCenter(bounds),
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    text: text.text,
  }
}
