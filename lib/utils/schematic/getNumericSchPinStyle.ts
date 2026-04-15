import type { SchematicPinStyle } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { NumericSchPinStyle } from "./getAllDimensionsForSchematicBox"
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
  pinStyles: SchematicPinStyle | undefined,
  pinLabels?: Record<string, string[] | string> | null,
): NumericSchPinStyle | undefined => {
  if (!pinStyles) return undefined

  const numericPinStyles: NumericSchPinStyle = {}

  // Convert each pin style key to a numeric pin number
  for (const [pinNameOrLabel, pinStyle] of Object.entries(pinStyles)) {
    const pinNumber = parsePinNumberFromLabelsOrThrow(pinNameOrLabel, pinLabels)
    const leftMargin = pinStyle.marginLeft ?? pinStyle.leftMargin
    const rightMargin = pinStyle.marginRight ?? pinStyle.rightMargin
    const topMargin = pinStyle.marginTop ?? pinStyle.topMargin
    const bottomMargin = pinStyle.marginBottom ?? pinStyle.bottomMargin

    const existingStyle = numericPinStyles[`pin${pinNumber}`] ?? {}
    const nextStyle = { ...existingStyle }

    if (leftMargin !== undefined)
      nextStyle.leftMargin = distance.parse(leftMargin)
    if (rightMargin !== undefined) {
      nextStyle.rightMargin = distance.parse(rightMargin)
    }
    if (topMargin !== undefined) nextStyle.topMargin = distance.parse(topMargin)
    if (bottomMargin !== undefined) {
      nextStyle.bottomMargin = distance.parse(bottomMargin)
    }

    numericPinStyles[`pin${pinNumber}`] = nextStyle
  }

  return numericPinStyles
}
