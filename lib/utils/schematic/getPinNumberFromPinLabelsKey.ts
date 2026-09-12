const PIN_LABELS_KEY_RE = /^(?:pin)?(\d+)$/

/**
 * Resolves a pinLabels key to a pin number.
 *
 * A key is either a pin number (`pin1`, `1`) or a footprint pad name
 * (`pinA1`, `A1`). Pad names only resolve when a footprint pad map is passed,
 * because the pad-to-pin-number mapping comes from the footprint.
 */
export const getPinNumberFromPinLabelsKey = (
  pinKey: string,
  footprintPadPinNumberMap?: Map<string, number> | null,
): number | null => {
  const match = pinKey.match(PIN_LABELS_KEY_RE)
  if (match) return Number.parseInt(match[1], 10)

  if (footprintPadPinNumberMap && footprintPadPinNumberMap.size > 0) {
    const lowercaseKey = pinKey.toLowerCase()
    const directPinNumber = footprintPadPinNumberMap.get(lowercaseKey)
    if (directPinNumber !== undefined) return directPinNumber

    if (lowercaseKey.startsWith("pin")) {
      const strippedPinNumber = footprintPadPinNumberMap.get(
        lowercaseKey.slice(3),
      )
      if (strippedPinNumber !== undefined) return strippedPinNumber
    }
  }

  return null
}
