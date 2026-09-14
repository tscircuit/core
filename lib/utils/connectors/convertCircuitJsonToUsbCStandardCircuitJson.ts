import type { AnyCircuitElement } from "circuit-json"
import { STANDARD_USB_C_PIN_LABELS } from "./usb-c-canonical-pin-definitions"

const PIN_NUMBER_HINT_PATTERN = /^(?:pin)?(\d+)$/i
const SHELL_LABEL_PATTERN = /^SHELL\d+$/
const dedupeHintsPreservingOrder = (hints: string[]): string[] =>
  Array.from(new Set(hints))

const SHELL_LABELS_IN_ORDER = STANDARD_USB_C_PIN_LABELS.map(
  ({ label }) => label,
).filter((label) => SHELL_LABEL_PATTERN.test(label))

const getPinKeysFromHints = (hints: string[]): Array<`pin${number}`> => {
  const pinKeys: Array<`pin${number}`> = []
  for (const hint of hints) {
    const matchedPin = hint.match(PIN_NUMBER_HINT_PATTERN)
    if (!matchedPin) continue
    pinKeys.push(`pin${Number.parseInt(matchedPin[1], 10)}`)
  }
  return pinKeys
}

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

  // A fetched part can carry several shell/mounting pads that share one pin
  // number. Keying labels by pin number alone would hand the same SHELL label
  // to every one of those pads, leaving a port that references several
  // non-overlapping pads. Give each extra shell pad a free SHELL label on a
  // fresh pin number so every pad resolves to its own port.
  const freeShellLabels = SHELL_LABELS_IN_ORDER.filter(
    (label) =>
      !Object.values(canonicalHintsByPin).some((labels) =>
        labels.includes(label),
      ),
  )
  const usedPinNumbers = new Set<number>()
  for (const elm of partCircuitJson) {
    if (elm.type === "source_port" && typeof elm.pin_number === "number") {
      usedPinNumbers.add(elm.pin_number)
    }
    if ("port_hints" in elm && Array.isArray(elm.port_hints)) {
      for (const pinKey of getPinKeysFromHints(
        elm.port_hints.filter((h): h is string => typeof h === "string"),
      )) {
        usedPinNumbers.add(Number.parseInt(pinKey.slice(3), 10))
      }
    }
  }
  let nextCandidatePin = Math.max(0, ...usedPinNumbers)
  const allocateFreePinNumber = (): number => {
    do {
      nextCandidatePin++
    } while (usedPinNumbers.has(nextCandidatePin))
    usedPinNumbers.add(nextCandidatePin)
    return nextCandidatePin
  }

  const shellPadCountByPin = new Map<`pin${number}`, number>()
  const padReassignments = new Map<
    AnyCircuitElement,
    { pinNumber: number; label: string }
  >()
  for (const elm of partCircuitJson) {
    if (elm.type === "source_port") continue
    if (!("port_hints" in elm) || !Array.isArray(elm.port_hints)) continue
    const hints = elm.port_hints.filter(
      (h): h is string => typeof h === "string",
    )
    for (const pinKey of getPinKeysFromHints(hints)) {
      const label = canonicalHintsByPin[pinKey]?.[0]
      if (!label || !SHELL_LABEL_PATTERN.test(label)) continue
      const seenCount = shellPadCountByPin.get(pinKey) ?? 0
      shellPadCountByPin.set(pinKey, seenCount + 1)
      if (seenCount === 0) break
      const freeLabel = freeShellLabels.shift()
      if (!freeLabel) break
      padReassignments.set(elm, {
        pinNumber: allocateFreePinNumber(),
        label: freeLabel,
      })
      break
    }
  }

  return partCircuitJson.map((elm) => {
    if (!("port_hints" in elm) || !Array.isArray(elm.port_hints)) return elm

    const originalHints = elm.port_hints
      .filter((h): h is string => typeof h === "string")
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
    if (originalHints.length === 0) return elm

    const reassignment = padReassignments.get(elm)
    if (reassignment) {
      const remappedHints = originalHints.map((hint) =>
        hint.match(PIN_NUMBER_HINT_PATTERN)
          ? `pin${reassignment.pinNumber}`
          : hint,
      )
      return {
        ...elm,
        port_hints: dedupeHintsPreservingOrder([
          ...remappedHints,
          reassignment.label,
        ]),
      }
    }

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
