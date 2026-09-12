const SI_PREFIX_MULTIPLIERS: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  m: 1e-3,
  "": 1,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
}

export const parseSimulationGraphValue = (
  value: number | string | undefined,
) => {
  if (value === undefined) return undefined
  if (typeof value === "number") return value

  const trimmed = value.trim()
  // The exponent is part of the numeric value, so it must be consumed before
  // the SI prefix. It requires at least one digit so unit strings that merely
  // start with "e" (e.g. "1eV") keep falling through to the prefix group.
  const match = trimmed.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*([pnumµkKMG]?)/,
  )
  if (!match) return undefined

  const numericValue = Number(match[1])
  if (!Number.isFinite(numericValue)) return undefined

  return numericValue * (SI_PREFIX_MULTIPLIERS[match[2] ?? ""] ?? 1)
}
