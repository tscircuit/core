import type { PcbStyle } from "@tscircuit/props"

const DEFAULT_VIA_HOLE_DIAMETER = 0.2
const DEFAULT_VIA_PAD_DIAMETER = 0.3

const parseDistance = (
  value: string | number | undefined,
  fallback: number,
) => {
  if (value === undefined) return fallback
  if (typeof value === "number") return value
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const getViaDiameterDefaults = (
  pcbStyle?: PcbStyle,
  fallback?: { holeDiameter?: number; padDiameter?: number },
) => {
  return {
    holeDiameter: parseDistance(
      pcbStyle?.viaHoleDiameter,
      fallback?.holeDiameter ?? DEFAULT_VIA_HOLE_DIAMETER,
    ),
    padDiameter: parseDistance(
      pcbStyle?.viaPadDiameter,
      fallback?.padDiameter ?? DEFAULT_VIA_PAD_DIAMETER,
    ),
  }
}

export const getViaDiameterDefaultsWithOverrides = (
  overrides: { holeDiameter?: number; padDiameter?: number },
  pcbStyle?: PcbStyle,
  fallback?: { holeDiameter?: number; padDiameter?: number },
) => {
  const defaults = getViaDiameterDefaults(pcbStyle, fallback)
  return {
    holeDiameter: overrides.holeDiameter ?? defaults.holeDiameter,
    padDiameter: overrides.padDiameter ?? defaults.padDiameter,
  }
}
