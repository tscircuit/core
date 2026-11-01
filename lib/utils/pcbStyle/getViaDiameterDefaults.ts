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
  board?: {
    min_via_hole_diameter?: number
    min_via_pad_diameter?: number
  } | null,
) => {
  const holeDiameter = parseDistance(
    pcbStyle?.viaHoleDiameter,
    DEFAULT_VIA_HOLE_DIAMETER,
  )
  const padDiameter = parseDistance(
    pcbStyle?.viaPadDiameter,
    DEFAULT_VIA_PAD_DIAMETER,
  )
  return {
    holeDiameter:
      pcbStyle?.viaHoleDiameter !== undefined
        ? Math.max(holeDiameter, board?.min_via_hole_diameter ?? 0)
        : (board?.min_via_hole_diameter ?? holeDiameter),
    padDiameter:
      pcbStyle?.viaPadDiameter !== undefined
        ? Math.max(padDiameter, board?.min_via_pad_diameter ?? 0)
        : (board?.min_via_pad_diameter ?? padDiameter),
  }
}

export const getViaDiameterDefaultsWithOverrides = (
  overrides: { holeDiameter?: number; padDiameter?: number },
  pcbStyle?: PcbStyle,
) => {
  const defaults = getViaDiameterDefaults(pcbStyle)
  return {
    holeDiameter: overrides.holeDiameter ?? defaults.holeDiameter,
    padDiameter: overrides.padDiameter ?? defaults.padDiameter,
  }
}
