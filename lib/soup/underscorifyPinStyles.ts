import type { SchematicPinStyle } from "@tscircuit/props"
import { schematic_component } from "circuit-json"
import { z } from "zod"
import { parsePinNumberFromLabelsOrThrow } from "../utils/schematic/parsePinNumberFromLabelsOrThrow"

type UnderscorePinStyles = z.input<typeof schematic_component>["pin_styles"]

export const underscorifyPinStyles = (
  pinStyles: Record<string, SchematicPinStyle> | undefined,
  pinLabels?: Record<string, string[] | string> | null,
): UnderscorePinStyles | undefined => {
  if (!pinStyles) return undefined
  const underscorePinStyles: UnderscorePinStyles = {}
  const mergedStyles: Record<number, SchematicPinStyle> = {}

  // First pass: collect all styles by pin number
  for (const [pinNameOrLabel, pinStyle] of Object.entries(pinStyles) as Array<
    [string, SchematicPinStyle]
  >) {
    const pinNumber = parsePinNumberFromLabelsOrThrow(pinNameOrLabel, pinLabels)
    
    // Merge with existing styles for this pin
    mergedStyles[pinNumber] = {
      ...mergedStyles[pinNumber],
      ...pinStyle,
    }
  }

  // Second pass: convert to underscore format
  for (const [pinNumber, pinStyle] of Object.entries(mergedStyles)) {
    const pinKey = `pin${pinNumber}`
    underscorePinStyles[pinKey] = {
      bottom_margin: pinStyle.bottomMargin as number,
      left_margin: pinStyle.leftMargin as number,
      right_margin: pinStyle.rightMargin as number,
      top_margin: pinStyle.topMargin as number,
    }
  }

  return underscorePinStyles
}
