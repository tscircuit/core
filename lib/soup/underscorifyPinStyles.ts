import type { SchematicPinStyles } from "@tscircuit/props"
import { schematic_component } from "@tscircuit/soup"
import { z } from "zod"

type UnderscorePinStyles = z.input<typeof schematic_component>["pin_styles"]

export const underscorifyPinStyles = (
  pinStyles: SchematicPinStyles | undefined,
): UnderscorePinStyles | undefined => {
  if (!pinStyles) return undefined
  const underscorePinStyles: UnderscorePinStyles = {}

  for (const [pinName, pinStyle] of Object.entries(pinStyles)) {
    underscorePinStyles[pinName] = {
      bottom_margin: pinStyle.bottomMargin,
      left_margin: pinStyle.leftMargin,
      right_margin: pinStyle.rightMargin,
      top_margin: pinStyle.topMargin,
    }
  }

  return underscorePinStyles
}
