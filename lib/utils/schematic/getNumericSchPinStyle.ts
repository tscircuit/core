import type { SchematicPinStyle } from "@tscircuit/props"
import { parsePinNumberFromLabelsOrThrow } from "./parsePinNumberFromLabelsOrThrow"

/**
 * Converts a pin style object that may use labels or pin numbers as keys into one that
 * uses only numeric pin numbers as keys.
 *
 * @param pinStyles The pin styles object that may use labels or pin numbers as keys
 * @param pinLabels Optional mapping of pin numbers to their labels
 * @returns A pin styles object using only numeric pin numbers as keys
 */
export const getNumericSchPinStyle = (
  pinStyles: Record<string, SchematicPinStyle> | undefined,
  pinLabels?: Record<string, string[] | string> | null,
):
  | Record<`pin${number}` | number | `${number}`, SchematicPinStyle>
  | undefined => {
  if (!pinStyles) return undefined

  const numericPinStyles: Record<
    `pin${number}` | number | `${number}`,
    SchematicPinStyle
  > = {}

  // Convert each pin style key to a numeric pin number
  for (const [pinNameOrLabel, pinStyle] of Object.entries(pinStyles)) {
    const pinNumber = parsePinNumberFromLabelsOrThrow(pinNameOrLabel, pinLabels)

    const pinStyleWithSideFirst = {
      leftMargin: pinStyle.marginLeft ?? pinStyle.leftMargin,
      rightMargin: pinStyle.marginRight ?? pinStyle.rightMargin,
      topMargin: pinStyle.marginTop ?? pinStyle.topMargin,
      bottomMargin: pinStyle.marginBottom ?? pinStyle.bottomMargin,
    }

    // Merge with any existing styles for this pin number
    numericPinStyles[`pin${pinNumber}`] = {
      ...numericPinStyles[`pin${pinNumber}`],
      ...pinStyleWithSideFirst,
    }
  }

  return numericPinStyles
}
