const PIN_LABELS_KEY_RE = /^(?:pin)?(\d+)$/

export const buildInvalidPinLabelsKeyMessage = (pinKey: string): string =>
  `Invalid pinLabels key "${pinKey}". Expected "pin<number>" (e.g. pin1, pin2).`

export const getPinNumberFromPinLabelsKey = (pinKey: string): number | null => {
  const match = pinKey.match(PIN_LABELS_KEY_RE)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

export const getPinNumberFromPinLabelsKeyOrThrow = (pinKey: string): number => {
  const pinNumber = getPinNumberFromPinLabelsKey(pinKey)
  if (pinNumber === null) {
    throw new Error(buildInvalidPinLabelsKeyMessage(pinKey))
  }
  return pinNumber
}
