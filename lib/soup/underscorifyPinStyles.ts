import type { SchematicPinStyle } from "@tscircuit/props"
import { schematic_component } from "circuit-json"
import { z } from "zod"

type UnderscorePinStyles = z.input<typeof schematic_component>["pin_styles"]

export const underscorifyPinStyles = (
  pinStyles: Record<string, SchematicPinStyle> | undefined,
): UnderscorePinStyles | undefined => {
  if (!pinStyles) return undefined
  const underscorePinStyles: UnderscorePinStyles = {}

  for (const [pinName, pinStyle] of Object.entries(pinStyles) as Array<
    [string, SchematicPinStyle]
  >) {
    underscorePinStyles[pinName] = {
      bottom_margin: pinStyle.bottomMargin as number,
      left_margin: pinStyle.leftMargin as number,
      right_margin: pinStyle.rightMargin as number,
      top_margin: pinStyle.topMargin as number,
    }
  }

  return underscorePinStyles
}
