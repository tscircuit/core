import type { ParsedEnclosureCutoutApertureProps } from "@tscircuit/props"

export const getApertureHeight = (
  aperture: ParsedEnclosureCutoutApertureProps,
): number => {
  const margin = aperture.margin ?? 0
  return aperture.shape === "circle"
    ? 2 * (aperture.radius + margin)
    : aperture.height + margin * 2
}
