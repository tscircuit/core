import { getPinNumberFromPinLabelsKey } from "./getPinNumberFromPinLabelsKey"

export const parsePinNumberFromLabelsOrThrow = (
  pinNumberOrLabel: string | number,
  pinLabels?: Record<string, string[] | string> | null,
  opts?: { componentName?: string },
): number => {
  const componentContext = opts?.componentName
    ? ` for component "${opts.componentName}"`
    : ""
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
      `No pin labels provided${componentContext} and pin number or label is not a number: "${pinNumberOrLabel}"`,
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

  const definedLabels = Object.values(pinLabels)
    .flatMap((aliases) => (Array.isArray(aliases) ? aliases : [aliases]))
    .filter((label): label is string => typeof label === "string")

  throw new Error(
    `Pin label "${pinNumberOrLabel}"${componentContext} is not defined in pinLabels. ` +
      `Defined pin labels are: ${
        definedLabels.length > 0
          ? definedLabels.map((label) => `"${label}"`).join(", ")
          : "(none)"
      }`,
  )
}
