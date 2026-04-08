const PIN_LABELS_KEY_RE = /^(?:pin)?(\d+)$/

export const getPinNumberFromPinLabelsKey = (pinKey: string): number | null => {
  const match = pinKey.match(PIN_LABELS_KEY_RE)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}
