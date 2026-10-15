import { resolvePinLabels } from "./resolvePinLabels"
import { getPinNumberFromPinLabelsKey } from "./getPinNumberFromPinLabelsKey"
import { getPinLabelRecommendation } from "../filterPinLabels"

const getInvalidPinLabelMessage = (pinNumberOrLabel: string): string => {
  const recommendation = getPinLabelRecommendation(pinNumberOrLabel)
  const recommendationMessage = recommendation
    ? ` Try using "${recommendation}" instead.`
    : ""
  return `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}".${recommendationMessage}`
}

export const parsePinNumberFromLabelsOrThrow = (
  pinNumberOrLabel: string | number,
  pinLabels?: Record<string, readonly string[] | string> | null,
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
    throw new Error(getInvalidPinLabelMessage(pinNumberOrLabel))
  }

  const resolvedPins = resolvePinLabels(pinLabels)
  const physicalPin = resolvedPins.find(
    (pin) => pin.physicalPinName === pinNumberOrLabel,
  )
  if (physicalPin) return physicalPin.pinNumber
  const matches = resolvedPins.filter((pin) =>
    pin.labels.includes(pinNumberOrLabel),
  )
  if (matches.length > 1 && matches.some((pin) => pin.physicalPinName)) {
    throw new Error(
      `Ambiguous pin label "${pinNumberOrLabel}"; use a physical ball name: ${matches.map((pin) => pin.physicalPinName ?? `pin${pin.pinNumber}`).join(", ")}.`,
    )
  }
  if (matches.length > 0) return matches[0].pinNumber

  throw new Error(getInvalidPinLabelMessage(pinNumberOrLabel))
}
