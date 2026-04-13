import type { AnyCircuitElement } from "circuit-json"

/**
 * Canonical USB-C pin labels every USB-C connector schematic should expose.
 * The order matters: earlier labels get first pick when multiple unassigned
 * ports could match.
 */
const STANDARD_USB_C_PIN_LABELS: Array<{ label: string; aliases: string[] }> = [
  { label: "GND1", aliases: [] },
  { label: "VBUS1", aliases: [] },
  { label: "CC1", aliases: [] },
  { label: "DP1", aliases: [] },
  { label: "DM1", aliases: ["DN1"] },
  { label: "SBU1", aliases: [] },
  { label: "SBU2", aliases: [] },
  { label: "DM2", aliases: ["DN2"] },
  { label: "DP2", aliases: [] },
  { label: "CC2", aliases: [] },
  { label: "VBUS2", aliases: [] },
  { label: "GND2", aliases: [] },
  { label: "SHELL1", aliases: ["MH1", "EH1", "MOUNT1"] },
  { label: "SHELL2", aliases: ["MH2", "EH2", "MOUNT2"] },
  { label: "SHELL3", aliases: ["MH3", "EH3", "MOUNT3"] },
  { label: "SHELL4", aliases: ["MH4", "EH4", "MOUNT4"] },
]

const PIN_NUMBER_HINT_PATTERN = /^(?:pin)?(\d+)$/i
const dedupeHintsPreservingOrder = (hints: string[]): string[] =>
  Array.from(new Set(hints))

/**
 * Convert part circuit JSON into USB-C-standardized circuit JSON by appending
 * canonical USB-C labels to `port_hints` while preserving original hints and
 * pin numbers.
 */
export const convertCircuitJsonToUsbCStandardCircuitJson = (
  partCircuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const unassignedPorts: Array<{
    pinKey: `pin${number}`
    upperCaseHints: Set<string>
  }> = []
  for (const elm of partCircuitJson) {
    if (elm.type !== "source_port") continue
    const pinNumber = elm.pin_number
    if (typeof pinNumber !== "number") continue
    const upperCaseHints = new Set<string>()
    for (const hint of elm.port_hints ?? []) {
      upperCaseHints.add(hint.trim().toUpperCase())
    }
    unassignedPorts.push({ pinKey: `pin${pinNumber}`, upperCaseHints })
  }

  const canonicalHintsByPin: Record<`pin${number}`, string[]> = {}
  for (const { label, aliases } of STANDARD_USB_C_PIN_LABELS) {
    const canonicalAndAliasHintsUpper = [label, ...aliases].map((s) =>
      s.toUpperCase(),
    )
    const matchIndex = unassignedPorts.findIndex((port) =>
      canonicalAndAliasHintsUpper.some((hint) => port.upperCaseHints.has(hint)),
    )
    if (matchIndex === -1) continue
    const { pinKey } = unassignedPorts[matchIndex]
    canonicalHintsByPin[pinKey] = [label]
    unassignedPorts.splice(matchIndex, 1)
  }

  if (Object.keys(canonicalHintsByPin).length === 0) return partCircuitJson

  return partCircuitJson.map((elm) => {
    if (!("port_hints" in elm) || !Array.isArray(elm.port_hints)) return elm

    const originalHints = elm.port_hints
      .filter((h): h is string => typeof h === "string")
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
    if (originalHints.length === 0) return elm

    const pinKeys = new Set<`pin${number}`>()
    if (elm.type === "source_port" && typeof elm.pin_number === "number") {
      pinKeys.add(`pin${elm.pin_number}`)
    }
    for (const hint of originalHints) {
      const matchedPin = hint.match(PIN_NUMBER_HINT_PATTERN)
      if (!matchedPin) continue
      pinKeys.add(`pin${Number.parseInt(matchedPin[1], 10)}`)
    }

    const canonicalHintsToAdd: string[] = []
    for (const pinKey of pinKeys) {
      canonicalHintsToAdd.push(...(canonicalHintsByPin[pinKey] ?? []))
    }
    if (canonicalHintsToAdd.length === 0) return elm

    return {
      ...elm,
      port_hints: dedupeHintsPreservingOrder([
        ...originalHints,
        ...canonicalHintsToAdd,
      ]),
    }
  })
}
