import type { PinLabelsProp } from "@tscircuit/props"

export type TwoTerminalPin = 1 | 2

const isTwoTerminalPin = (pin: number): pin is TwoTerminalPin =>
  pin === 1 || pin === 2

const positiveLabels = new Set(["a", "anode", "pos", "positive"])
const negativeLabels = new Set(["k", "c", "cathode", "neg", "negative"])

/** Resolve a two-terminal pin mapping; callers own package and artwork policy. */
export const resolveTwoTerminalPinMapping = ({
  name,
  pinLabels,
  explicitPositive,
  explicitNegative,
  positiveOption,
  negativeOption,
  defaultPositivePin = 1,
}: {
  name: string
  pinLabels?: PinLabelsProp
  explicitPositive?: number
  explicitNegative?: number
  positiveOption: string
  negativeOption: string
  defaultPositivePin?: TwoTerminalPin
}) => {
  let positivePinCandidate: number = defaultPositivePin
  let negativePinCandidate = 3 - defaultPositivePin
  const labelPolarities = [1, 2].map((pin) => {
    const labels = pinLabels?.[`pin${pin}`] ?? pinLabels?.[String(pin)] ?? []
    const aliases = (typeof labels === "string" ? [labels] : labels).map(
      (label) => label.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )
    const positive = aliases.some((label) => positiveLabels.has(label))
    const negative = aliases.some((label) => negativeLabels.has(label))
    if (positive && negative) {
      throw new Error(
        `${name} pin${pin} has conflicting positive and negative polarity labels.`,
      )
    }
    return positive === negative
      ? undefined
      : positive
        ? "positive"
        : "negative"
  })
  const hasPolarityLabels = labelPolarities.some(Boolean)
  if (hasPolarityLabels) {
    if (labelPolarities[0] === labelPolarities[1]) {
      throw new Error(
        `${name} must assign positive and negative polarity to different pins.`,
      )
    }
    positivePinCandidate =
      labelPolarities[0] === "positive" || labelPolarities[1] === "negative"
        ? 1
        : 2
    negativePinCandidate = 3 - positivePinCandidate
    if (
      (explicitPositive !== undefined &&
        explicitPositive !== positivePinCandidate) ||
      (explicitNegative !== undefined &&
        explicitNegative !== negativePinCandidate)
    ) {
      throw new Error(
        `${name} pinLabels conflict with the footprint's ${positiveOption}/${negativeOption} options.`,
      )
    }
  } else {
    if (explicitPositive !== undefined) positivePinCandidate = explicitPositive
    else if (explicitNegative !== undefined)
      positivePinCandidate = 3 - explicitNegative
    negativePinCandidate =
      explicitNegative === undefined
        ? 3 - positivePinCandidate
        : explicitNegative
  }
  if (
    !isTwoTerminalPin(positivePinCandidate) ||
    !isTwoTerminalPin(negativePinCandidate) ||
    positivePinCandidate === negativePinCandidate
  ) {
    throw new Error(
      `${name} polarity options must identify distinct pins 1 and 2.`,
    )
  }

  return {
    positivePin: positivePinCandidate,
    negativePin: negativePinCandidate,
    hasPolarityLabels,
  }
}
