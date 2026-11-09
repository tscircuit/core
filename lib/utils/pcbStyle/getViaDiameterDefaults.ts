import type { PcbStyle } from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent/PrimitiveComponent"

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

/** Via drill (hole) and copper pad diameters, in mm */
type ViaDiameters = { holeDiameter: number; padDiameter: number }

/**
 * Default via size when a via doesn't specify one. A pcbStyle via size wins,
 * then the board's resolved via minimums (so hand-placed vias match the vias
 * the autorouter creates), then the global defaults.
 */
export const getViaDiameterDefaults = (
  pcbStyle?: PcbStyle,
  boardMinViaDiameters?: ViaDiameters,
): ViaDiameters => {
  return {
    holeDiameter: parseDistance(
      pcbStyle?.viaHoleDiameter,
      boardMinViaDiameters?.holeDiameter ?? DEFAULT_VIA_HOLE_DIAMETER,
    ),
    padDiameter: parseDistance(
      pcbStyle?.viaPadDiameter,
      boardMinViaDiameters?.padDiameter ?? DEFAULT_VIA_PAD_DIAMETER,
    ),
  }
}

export const getViaDiameterDefaultsWithOverrides = (
  overrides: { holeDiameter?: number; padDiameter?: number },
  pcbStyle?: PcbStyle,
  boardMinViaDiameters?: ViaDiameters,
) => {
  const defaults = getViaDiameterDefaults(pcbStyle, boardMinViaDiameters)
  return {
    holeDiameter: overrides.holeDiameter ?? defaults.holeDiameter,
    padDiameter: overrides.padDiameter ?? defaults.padDiameter,
  }
}

/**
 * Default via size for a via created by `component` (a <via>, a trace's
 * pcbPath, a <pcbtrace> route...), using its inherited pcbStyle and the
 * minimums of the board it is on.
 */
export const getViaDiameterDefaultsForComponent = (
  component: Pick<
    PrimitiveComponent,
    "getInheritedMergedProperty" | "_getBoard"
  >,
  overrides: { holeDiameter?: number; padDiameter?: number } = {},
) =>
  getViaDiameterDefaultsWithOverrides(
    overrides,
    component.getInheritedMergedProperty("pcbStyle"),
    component._getBoard()?._getResolvedMinViaDiameters?.(),
  )
