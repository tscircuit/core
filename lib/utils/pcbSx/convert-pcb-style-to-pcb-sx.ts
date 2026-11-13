import type { PcbStyle, PcbSx } from "@tscircuit/props"

/**
 * Converts a PcbStyle object into PcbSx format so both can be
 * resolved through the same code path.
 *
 * Mapping:
 *   silkscreenFontSize        -> "& silkscreentext": { fontSize }
 *   silkscreenTextVisibility  -> "& silkscreentext": { visibility }
 *   silkscreenTextPosition: "none" -> "& silkscreentext": { visibility: "hidden" }
 */
export function convertPcbStyleToPcbSx(
  pcbStyle: PcbStyle | undefined,
): PcbSx | undefined {
  if (!pcbStyle) return undefined

  const sx: PcbSx = {}
  const silkscreenTextSx: NonNullable<PcbSx["& silkscreentext"]> = {}

  if (pcbStyle.silkscreenFontSize !== undefined) {
    silkscreenTextSx.fontSize = pcbStyle.silkscreenFontSize
  }

  if (pcbStyle.silkscreenTextVisibility !== undefined) {
    silkscreenTextSx.visibility = pcbStyle.silkscreenTextVisibility
  } else if (pcbStyle.silkscreenTextPosition === "none") {
    silkscreenTextSx.visibility = "hidden"
  }

  if (Object.keys(silkscreenTextSx).length > 0) {
    sx["& silkscreentext"] = silkscreenTextSx
  }

  if (Object.keys(sx).length === 0) return undefined
  return sx
}
