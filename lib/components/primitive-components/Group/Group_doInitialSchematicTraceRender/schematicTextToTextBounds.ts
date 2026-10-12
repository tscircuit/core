import {
  getBoundFromCenteredRect,
  getBoundsCenter,
} from "@tscircuit/math-utils"
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

const REFDES_TEXT_BOX_CHIP_OVERLAP = 0.01
const REFDES_TEXT_BOX_CLEARANCE = 0.06

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
) {
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
      bounds.minX -= REFDES_TEXT_BOX_CLEARANCE
      bounds.maxX += REFDES_TEXT_BOX_CLEARANCE
      bounds.minY = componentBounds.maxY - REFDES_TEXT_BOX_CHIP_OVERLAP
      bounds.maxY =
        componentBounds.maxY + textHeight + REFDES_TEXT_BOX_CLEARANCE
    }
  }

  return {
    chipId: text.schematic_component_id,
    center: getBoundsCenter(bounds),
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    text: text.text,
    // Preserve the original anchor point in schematic world mm (+X right,
    // +Y up), separately from the padded routing obstacle. Rotation follows
    // Circuit JSON's clockwise screen convention.
    textPlacement: {
      position: text.position,
      anchor: text.anchor,
      fontSize: text.font_size ?? 0.18,
      rotation: text.rotation,
    },
  }
}
