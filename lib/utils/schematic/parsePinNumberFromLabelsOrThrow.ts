import {
  getPinNumberFromPinLabelsKey,
  getPinNumberFromPinLabelsKeyOrThrow,
} from "./getPinNumberFromPinLabelsKeyOrThrow"

export const parsePinNumberFromLabelsOrThrow = (
  pinNumberOrLabel: string | number,
  pinLabels?: Record<string, string[] | string> | null,
): number => {
  if (typeof pinNumberOrLabel === "number") {
    return pinNumberOrLabel
  }

  const directPinNumber = getPinNumberFromPinLabelsKey(pinNumberOrLabel)
  if (directPinNumber !== null) {
    return directPinNumber
  }

  if (pinNumberOrLabel.startsWith("pin")) {
    return getPinNumberFromPinLabelsKeyOrThrow(pinNumberOrLabel)
  }

  if (!pinLabels) {
    throw new Error(
      `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}"`,
    )
  }

  for (const pinNumberKey in pinLabels) {
    const aliases = Array.isArray(pinLabels[pinNumberKey])
      ? pinLabels[pinNumberKey]
      : [pinLabels[pinNumberKey]]

    if (aliases.includes(pinNumberOrLabel)) {
      return getPinNumberFromPinLabelsKeyOrThrow(pinNumberKey)
    }
  }

  throw new Error(
    `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}"`,
  )
}
