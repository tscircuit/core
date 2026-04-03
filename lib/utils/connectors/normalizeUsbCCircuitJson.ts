import type { AnyCircuitElement } from "circuit-json"

const GENERIC_PIN_RE = /^(pin)?\d+$/i

const USB_C_ALIAS_MAP: Record<string, string[]> = {
  DN1: ["DM1"],
  DN2: ["DM2"],
  DM1: ["DN1"],
  DM2: ["DN2"],
}

const isObject = (value: unknown): value is Record<string, any> => {
  return value !== null && typeof value === "object"
}

const parsePinNumberFromHint = (hint: string): number | null => {
  const match = hint.match(/^pin(\d+)$/i) ?? hint.match(/^(\d+)$/)
  if (!match) return null
  const pinNumber = Number.parseInt(match[1], 10)
  return Number.isNaN(pinNumber) ? null : pinNumber
}

const unique = (items: string[]): string[] => {
  return Array.from(new Set(items))
}

const getAliasesFromHints = (hints: unknown): string[] => {
  if (!Array.isArray(hints)) return []

  const aliases: string[] = []
  for (const hint of hints) {
    if (typeof hint !== "string") continue
    const trimmed = hint.trim()
    if (!trimmed) continue

    const upperHint = trimmed.toUpperCase()
    if (GENERIC_PIN_RE.test(upperHint)) continue

    aliases.push(upperHint)
    aliases.push(...(USB_C_ALIAS_MAP[upperHint] ?? []))
  }

  return unique(aliases)
}

const buildSourcePortAliasMap = (
  circuitJson: AnyCircuitElement[],
): Map<number, string[]> => {
  const sourcePortAliasMap = new Map<number, string[]>()

  for (const elm of circuitJson) {
    if (!isObject(elm) || elm.type !== "source_port") continue

    const pinNumber =
      typeof elm.pin_number === "number"
        ? elm.pin_number
        : typeof elm.name === "string"
          ? parsePinNumberFromHint(elm.name)
          : null

    if (!pinNumber) continue

    const aliases = getAliasesFromHints(elm.port_hints)
    if (aliases.length === 0) continue
    sourcePortAliasMap.set(pinNumber, aliases)
  }

  return sourcePortAliasMap
}

const normalizePortHints = (
  originalHints: unknown,
  sourcePortAliasMap: Map<number, string[]>,
): string[] | null => {
  if (!Array.isArray(originalHints)) return null

  const originalHintsAsStrings = originalHints.filter(
    (hint): hint is string =>
      typeof hint === "string" && hint.trim().length > 0,
  )
  if (originalHintsAsStrings.length === 0) return null

  const pinNumber = originalHintsAsStrings
    .map((hint) => parsePinNumberFromHint(hint))
    .find((value): value is number => value !== null)

  const sourcePortAliases =
    pinNumber !== undefined ? (sourcePortAliasMap.get(pinNumber) ?? []) : []

  const normalizedAliases = getAliasesFromHints(originalHintsAsStrings)

  return unique([
    ...originalHintsAsStrings,
    ...sourcePortAliases,
    ...normalizedAliases,
  ])
}

export const normalizeUsbCCircuitJson = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const sourcePortAliasMap = buildSourcePortAliasMap(circuitJson)
  if (sourcePortAliasMap.size === 0) return circuitJson

  return circuitJson.map((elm) => {
    if (!isObject(elm) || !("port_hints" in elm)) return elm

    const normalizedPortHints = normalizePortHints(
      elm.port_hints,
      sourcePortAliasMap,
    )

    if (!normalizedPortHints) return elm

    return {
      ...elm,
      port_hints: normalizedPortHints,
    }
  })
}
