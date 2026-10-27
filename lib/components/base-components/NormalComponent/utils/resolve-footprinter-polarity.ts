import { fp } from "@tscircuit/footprinter"
import type { PinLabelsProp } from "@tscircuit/props"

const footprinterFunctions = new Set(fp.getFootprintNames())

const positiveLabels = new Set(["a", "anode", "pos", "positive"])
const negativeLabels = new Set(["k", "c", "cathode", "neg", "negative"])

/** Select the Footprinter definition from component intent without changing props.
 * Footprinter owns the resulting geometry and fabrication artwork. Resolved
 * terminal identities remain available to core's electrical port initialization.
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
  if (!["Diode", "Led", "Capacitor", "Chip"].includes(componentName))
    return { footprint, positivePin: 1, negativePin: 2 }

  const capacitor = componentName === "Capacitor"
  const definition = footprint.trim()
  const parameters = fp.string(definition).params()
  // Invalid definitions must retain their authored spelling for normal diagnostics.
  if (!footprinterFunctions.has(parameters.fn)) {
    return { footprint, positivePin: 1, negativePin: 2 }
  }
  const hasPolarityModifier =
    parameters.polarized !== undefined || parameters.nonpolarized !== undefined

  // A generic chip does not acquire electrical polarity from its package name.
  // Preserve an explicitly authored modifier; otherwise request neutral artwork.
  if (componentName === "Chip") {
    return {
      footprint: hasPolarityModifier
        ? definition
        : `${definition}_nonpolarized`,
      positivePin: 1,
      negativePin: 2,
    }
  }

  // Match Footprinter's bare-size syntax, including dimensions and _metric.
  let resolvedFootprint = /^\d{4,5}(?=$|_|x)/.test(definition)
    ? `${capacitor ? "cap" : "diode"}${definition}`
    : definition
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
    if (
      polarized &&
      (parameters.nonpolarized ||
        parameters.polarized === false ||
        parameters.polarized === "false")
    ) {
      throw new Error(
        `${name} is polarized but its footprint explicitly disables polarity.`,
      )
    }
    if (!hasPolarityModifier) {
      resolvedFootprint += polarized ? "_polarized" : "_nonpolarized"
    }
  }

  // Add only missing modifiers so every consumer can resolve idempotently.
  const genericDiodePads =
    !capacitor && parameters.fn === "smdpads" && parameters.num_pins === 2
  if (hasPolarityLabels || genericDiodePads) {
    if (explicitPositive === undefined) {
      resolvedFootprint += `_${positiveOption}${positivePin}`
    }
    if (explicitNegative === undefined) {
      resolvedFootprint += `_${negativeOption}${negativePin}`
    }
  }
  return { footprint: resolvedFootprint, positivePin, negativePin }
}
