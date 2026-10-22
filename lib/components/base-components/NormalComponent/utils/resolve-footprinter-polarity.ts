import { fp } from "@tscircuit/footprinter"
import type { PinLabelsProp } from "@tscircuit/props"

const positiveLabels = new Set(["a", "anode", "pos", "positive"])
const negativeLabels = new Set(["k", "c", "cathode", "neg", "negative"])

/** Resolve electrical terminal identities before generating footprint artwork.
 * Numeric pad identities and footprint-local geometry remain unchanged.
 */
export function resolveFootprinterPolarity({
  footprint,
  componentName,
  name,
  pinLabels,
  polarized,
}: {
  footprint: string
  componentName: string
  name: string
  pinLabels?: PinLabelsProp
  polarized?: boolean
}) {
  if (!["Diode", "Led", "Capacitor"].includes(componentName))
    return { footprint, positivePin: 1, negativePin: 2 }

  const capacitor = componentName === "Capacitor"
  const parameters = fp.string(footprint).params()
  let positivePin = 1
  let negativePin = 2
  const positiveOption = capacitor ? "positivepin" : "anodepin"
  const negativeOption = capacitor ? "negativepin" : "cathodepin"
  const explicitPositive = parameters[positiveOption]
  const explicitNegative = parameters[negativeOption]
  const labelPolarities = [1, 2].map((pin) => {
    const labels = pinLabels?.[`pin${pin}`] ?? pinLabels?.[String(pin)] ?? []
    const aliases = (typeof labels === "string" ? [labels] : labels).map(
      (label) => label.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )
    const positive = aliases.some((label) => positiveLabels.has(label))
    const negative = aliases.some((label) => negativeLabels.has(label))
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
    positivePin =
      labelPolarities[0] === "positive" || labelPolarities[1] === "negative"
        ? 1
        : 2
    negativePin = 3 - positivePin
    if (
      (explicitPositive !== undefined &&
        Number(explicitPositive) !== positivePin) ||
      (explicitNegative !== undefined &&
        Number(explicitNegative) !== negativePin)
    ) {
      throw new Error(
        `${name} pinLabels conflict with the footprint's ${positiveOption}/${negativeOption} options.`,
      )
    }
  } else {
    if (!capacitor && ["do219ad", "sod323he"].includes(parameters.fn)) {
      positivePin = 2
      negativePin = 1
    }
    if (explicitPositive !== undefined) positivePin = Number(explicitPositive)
    else if (explicitNegative !== undefined)
      positivePin = 3 - Number(explicitNegative)
    negativePin =
      explicitNegative === undefined
        ? 3 - positivePin
        : Number(explicitNegative)
  }
  if (
    ![1, 2].includes(positivePin) ||
    ![1, 2].includes(negativePin) ||
    positivePin === negativePin
  ) {
    throw new Error(
      `${name} polarity options must identify distinct pins 1 and 2.`,
    )
  }

  if (capacitor) {
    if (polarized) {
      if (
        parameters.nonpolarized ||
        parameters.polarized === false ||
        parameters.polarized === "false"
      ) {
        throw new Error(
          `${name} is polarized but its footprint explicitly disables polarity.`,
        )
      }
      // Bare chip sizes normally select resistor geometry. Select capacitor
      // geometry when requesting capacitor-specific polarity artwork.
      const capacitorFootprint = /^\d{4,5}(?=_|$)/.test(footprint)
        ? `cap${footprint}`
        : footprint
      return {
        footprint: `${capacitorFootprint}_polarized_positivepin${positivePin}_negativepin${negativePin}`,
        positivePin,
        negativePin,
      }
    }
  } else if (hasPolarityLabels) {
    return {
      footprint: `${footprint}_anodepin${positivePin}_cathodepin${negativePin}`,
      positivePin,
      negativePin,
    }
  }
  return { footprint, positivePin, negativePin }
}
