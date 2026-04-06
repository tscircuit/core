import { getPinNumberFromPinLabelsKey } from "./getPinNumberFromPinLabelsKey"

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
    throw new Error(
      `Invalid pinLabels key "${pinNumberOrLabel}". Expected "pin\${number}" (e.g. pin1, pin2).`,
    )
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
      const pinNumber = getPinNumberFromPinLabelsKey(pinNumberKey)
      if (pinNumber === null) {
        throw new Error(
          `Invalid pinLabels key "${pinNumberKey}". Expected "pin\${number}" (e.g. pin1, pin2).`,
        )
      }
      return pinNumber
    }
  }

  throw new Error(
    `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}"`,
  )
}
