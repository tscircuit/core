import type { AnyCircuitElement } from "circuit-json"

const USB_C_CANONICAL_PIN_BY_LABEL: Record<string, number> = {
  GND1: 1,
  VBUS1: 2,
  SBU2: 3,
  CC1: 4,
  DM2: 5,
  DP1: 6,
  DM1: 7,
  DP2: 8,
  SBU1: 9,
  CC2: 10,
  VBUS2: 11,
  GND2: 12,
  SHELL1: 13,
  SHELL2: 14,
  SHELL3: 15,
  SHELL4: 16,
}

const USB_C_LABEL_PRIORITY = Object.keys(USB_C_CANONICAL_PIN_BY_LABEL)

type SourcePortInfo = {
  originalPinNumber: number
  canonicalPinNumber: number | null
  aliases: string[]
}

const GENERIC_PIN_RE = /^(pin)?\d+$/i

const isObject = (value: unknown): value is Record<string, any> => {
  return value !== null && typeof value === "object"
}

const parsePinNumberFromHint = (hint: string): number | null => {
  const match = hint.match(/^pin(\d+)$/i) ?? hint.match(/^(\d+)$/)
  if (!match) return null
  const pinNumber = Number.parseInt(match[1], 10)
  return Number.isNaN(pinNumber) ? null : pinNumber
}

const splitCombinedPadHint = (hint: string): string[] => {
  const upperHint = hint.toUpperCase()
  const match = upperHint.match(/^([AB]\d{1,2})([AB]\d{1,2})$/)
  if (!match) return [upperHint]
  return [match[1], match[2]]
}

const getCanonicalAliasesForHint = (hint: string): string[] => {
  const upperHint = hint.toUpperCase()

  if (upperHint === "DN1") return ["DN1", "DM1"]
  if (upperHint === "DN2") return ["DN2", "DM2"]

  const shellMatch = upperHint.match(/^EH([1-4])$/)
  if (shellMatch) {
    return [upperHint, `SHELL${shellMatch[1]}`]
  }

  return [upperHint]
}

const unique = (items: string[]): string[] => {
  return Array.from(new Set(items))
}

const getCanonicalPinNumberFromAliases = (aliases: string[]): number | null => {
  for (const label of USB_C_LABEL_PRIORITY) {
    if (aliases.includes(label)) {
      return USB_C_CANONICAL_PIN_BY_LABEL[label]
    }
  }
  return null
}

const extractAliasesFromSourcePort = (
  sourcePort: Record<string, any>,
): string[] => {
  const aliases: string[] = []

  for (const hint of sourcePort.port_hints ?? []) {
    if (typeof hint !== "string") continue
    const trimmedHint = hint.trim()
    if (!trimmedHint) continue

    for (const splitHint of splitCombinedPadHint(trimmedHint)) {
      for (const alias of getCanonicalAliasesForHint(splitHint)) {
        aliases.push(alias)
      }
    }
  }

  return unique(aliases)
}

const buildSourcePortInfoMap = (
  circuitJson: AnyCircuitElement[],
): Map<number, SourcePortInfo> => {
  const sourcePortInfoMap = new Map<number, SourcePortInfo>()

  for (const elm of circuitJson) {
    if (!isObject(elm) || elm.type !== "source_port") continue

    const pinNumber =
      typeof elm.pin_number === "number"
        ? elm.pin_number
        : typeof elm.name === "string"
          ? parsePinNumberFromHint(elm.name)
          : null

    if (!pinNumber) continue

    const aliases = extractAliasesFromSourcePort(elm)
    const canonicalPinNumber = getCanonicalPinNumberFromAliases(aliases)
    const canonicalLabel =
      canonicalPinNumber !== null
        ? USB_C_LABEL_PRIORITY.find(
            (label) =>
              USB_C_CANONICAL_PIN_BY_LABEL[label] === canonicalPinNumber,
          )
        : null

    sourcePortInfoMap.set(pinNumber, {
      originalPinNumber: pinNumber,
      canonicalPinNumber,
      aliases: unique([
        ...(canonicalLabel ? [canonicalLabel] : []),
        ...aliases.filter((alias) => !GENERIC_PIN_RE.test(alias)),
      ]),
    })
  }

  return sourcePortInfoMap
}

const shouldRemapPins = (
  sourcePortInfoMap: Map<number, SourcePortInfo>,
): boolean => {
  const canonicalPins = Array.from(sourcePortInfoMap.values())
    .map((info) => info.canonicalPinNumber)
    .filter((pinNumber): pinNumber is number => pinNumber !== null)

  if (canonicalPins.length < 8) return false

  return new Set(canonicalPins).size === canonicalPins.length
}

const normalizePortHints = (
  originalHints: unknown,
  sourcePortInfoMap: Map<number, SourcePortInfo>,
  remapPins: boolean,
): string[] | null => {
  if (!Array.isArray(originalHints)) return null

  const originalHintsAsStrings = originalHints.filter(
    (hint): hint is string => typeof hint === "string",
  )

  const originalPinHint = originalHintsAsStrings
    .map((hint) => parsePinNumberFromHint(hint))
    .find((pinNumber): pinNumber is number => pinNumber !== null)

  if (originalPinHint === undefined) return null

  const sourcePortInfo = sourcePortInfoMap.get(originalPinHint)
  if (!sourcePortInfo) return null

  const resolvedPinNumber =
    remapPins && sourcePortInfo.canonicalPinNumber !== null
      ? sourcePortInfo.canonicalPinNumber
      : sourcePortInfo.originalPinNumber

  const normalizedExistingHints = unique(
    originalHintsAsStrings
      .filter((hint) => !GENERIC_PIN_RE.test(hint))
      .flatMap((hint) => splitCombinedPadHint(hint))
      .flatMap((hint) => getCanonicalAliasesForHint(hint))
      .filter((hint) => !GENERIC_PIN_RE.test(hint)),
  )

  return unique([
    `pin${resolvedPinNumber}`,
    ...sourcePortInfo.aliases,
    ...normalizedExistingHints,
  ])
}

export const normalizeUsbCCircuitJson = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const sourcePortInfoMap = buildSourcePortInfoMap(circuitJson)
  if (sourcePortInfoMap.size === 0) return circuitJson

  const remapPins = shouldRemapPins(sourcePortInfoMap)

  return circuitJson.map((elm) => {
    if (!isObject(elm)) return elm

    if (elm.type === "source_port") {
      const pinNumber =
        typeof elm.pin_number === "number"
          ? elm.pin_number
          : typeof elm.name === "string"
            ? parsePinNumberFromHint(elm.name)
            : null

      if (!pinNumber) return elm

      const sourcePortInfo = sourcePortInfoMap.get(pinNumber)
      if (!sourcePortInfo) return elm

      const resolvedPinNumber =
        remapPins && sourcePortInfo.canonicalPinNumber !== null
          ? sourcePortInfo.canonicalPinNumber
          : sourcePortInfo.originalPinNumber

      return {
        ...elm,
        pin_number: resolvedPinNumber,
        name: `pin${resolvedPinNumber}`,
        port_hints: unique([
          `pin${resolvedPinNumber}`,
          ...sourcePortInfo.aliases,
        ]),
      }
    }

    if (!("port_hints" in elm)) return elm

    const normalizedPortHints = normalizePortHints(
      elm.port_hints,
      sourcePortInfoMap,
      remapPins,
    )

    if (!normalizedPortHints) return elm

    return {
      ...elm,
      port_hints: normalizedPortHints,
    }
  })
}
