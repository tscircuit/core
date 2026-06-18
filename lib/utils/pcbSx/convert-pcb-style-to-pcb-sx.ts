import type { PcbStyle, PcbSx } from "@tscircuit/props"

/**
 * Converts a PcbStyle object into PcbSx format so both can be
 * resolved through the same code path.
 *
 * Mapping:
 *   silkscreenFontSize        -> "& silkscreentext": { fontSize }
 *   silkscreenTextVisibility  -> "& silkscreentext": { visibility }
 */
export function convertPcbStyleToPcbSx(
  pcbStyle: PcbStyle | undefined,
): PcbSx | undefined {
  if (!pcbStyle) return undefined

  const sx: PcbSx = {}

  if (
    pcbStyle.silkscreenFontSize !== undefined ||
    pcbStyle.silkscreenTextVisibility !== undefined
  ) {
    sx["& silkscreentext"] = {
      ...(pcbStyle.silkscreenFontSize !== undefined
        ? { fontSize: pcbStyle.silkscreenFontSize }
        : {}),
      ...(pcbStyle.silkscreenTextVisibility !== undefined
        ? { visibility: pcbStyle.silkscreenTextVisibility }
        : {}),
    }
  }

  if (Object.keys(sx).length === 0) return undefined
  return sx
}
