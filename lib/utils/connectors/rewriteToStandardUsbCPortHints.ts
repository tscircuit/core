import type { AnyCircuitElement } from "circuit-json"

const PIN_HINT_RE = /^(?:pin)?(\d+)$/i

const USB_C_STANDARD_PORT_HINT_ALIASES: Record<string, string[]> = {
  GND1: [],
  VBUS1: [],
  SBU2: [],
  CC1: [],
  DM2: ["DN2"],
  DP1: [],
  DM1: ["DN1"],
  DP2: [],
  SBU1: [],
  CC2: [],
  VBUS2: [],
  GND2: [],
  SHELL1: [],
  SHELL2: [],
  SHELL3: [],
  SHELL4: [],
}

const unique = (hints: string[]): string[] => Array.from(new Set(hints))

/**
 * Rewrite USB-C `port_hints` so each pin includes standard USB-C hints and
 * known aliases using source-port hints as the per-pin source of truth.
 *
 * Transformation scope:
 * - rewrite `port_hints` only
 * - never remap `pin_number`
 * - never rename ports
 */
export const rewriteToStandardUsbCPortHints = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const aliasToStandardHint: Record<string, string> = {}
  for (const [standardHint, aliases] of Object.entries(
    USB_C_STANDARD_PORT_HINT_ALIASES,
  )) {
    aliasToStandardHint[standardHint] = standardHint
    for (const alias of aliases) {
      aliasToStandardHint[alias] = standardHint
    }
  }

  const sourceAliasesByPin = new Map<number, string[]>()
  for (const elm of circuitJson) {
    if (
      elm &&
      typeof elm === "object" &&
      elm.type === "source_port" &&
      typeof (elm as any).pin_number === "number"
    ) {
      const pin = (elm as any).pin_number as number
      const hints = Array.isArray((elm as any).port_hints)
        ? ((elm as any).port_hints as unknown[])
            .filter((h): h is string => typeof h === "string")
            .map((h) => h.trim())
            .filter((h) => h.length > 0 && !PIN_HINT_RE.test(h))
        : []
      if (hints.length > 0) sourceAliasesByPin.set(pin, unique(hints))
    }
  }

  if (sourceAliasesByPin.size === 0) return circuitJson

  return circuitJson.map((elm) => {
    if (!elm || typeof elm !== "object" || !("port_hints" in elm)) return elm
    if (!Array.isArray((elm as any).port_hints)) return elm

    const originalHints = ((elm as any).port_hints as unknown[])
      .filter((h): h is string => typeof h === "string")
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
    if (originalHints.length === 0) return elm

    const pinNumbers = new Set<number>()
    if (
      elm.type === "source_port" &&
      typeof (elm as any).pin_number === "number"
    ) {
      pinNumbers.add((elm as any).pin_number)
    }
    for (const hint of originalHints) {
      const m = hint.match(PIN_HINT_RE)
      if (m) pinNumbers.add(Number.parseInt(m[1], 10))
    }

    const sourceAliases: string[] = []
    for (const pin of pinNumbers) {
      sourceAliases.push(...(sourceAliasesByPin.get(pin) ?? []))
    }

    const standardHints = new Set<string>()
    for (const hint of [...originalHints, ...sourceAliases]) {
      const standard = aliasToStandardHint[hint.toUpperCase()]
      if (standard) standardHints.add(standard)
    }

    const addedHints: string[] = []
    for (const standardHint of standardHints) {
      addedHints.push(
        standardHint,
        ...USB_C_STANDARD_PORT_HINT_ALIASES[standardHint],
      )
    }

    const rewrittenPortHints = unique([
      ...originalHints,
      ...sourceAliases,
      ...addedHints,
    ])

    return {
      ...elm,
      port_hints: rewrittenPortHints,
    }
  })
}
