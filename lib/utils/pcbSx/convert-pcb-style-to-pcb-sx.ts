import type { PcbStyle, PcbSx } from "@tscircuit/props"

/**
 * Converts a PcbStyle object into PcbSx format so both can be
 * resolved through the same code path.
 *
 * Mapping:
 *   silkscreenFontSize        -> "& silkscreentext": { fontSize }
 *   silkscreenTextVisibility  -> "& silkscreentext": { visibility }
 *   silkscreenTextPosition    -> "& silkscreentext": { pcbX, pcbY, visibility }
 *     - { offsetX, offsetY }  -> pcbX, pcbY
 *     - "centered"            -> pcbX: 0, pcbY: 0
 *     - "outside"             -> no-op (footprinter default)
 *     - "none"                -> visibility: "hidden"
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
  }

  if (pcbStyle.silkscreenTextPosition !== undefined) {
    if (
      typeof pcbStyle.silkscreenTextPosition === "object" &&
      pcbStyle.silkscreenTextPosition !== null
    ) {
      if (pcbStyle.silkscreenTextPosition.offsetX !== undefined) {
        silkscreenTextSx.pcbX = pcbStyle.silkscreenTextPosition.offsetX
      }
      if (pcbStyle.silkscreenTextPosition.offsetY !== undefined) {
        silkscreenTextSx.pcbY = pcbStyle.silkscreenTextPosition.offsetY
      }
    } else if (pcbStyle.silkscreenTextPosition === "centered") {
      silkscreenTextSx.pcbX = 0
      silkscreenTextSx.pcbY = 0
    } else if (pcbStyle.silkscreenTextPosition === "outside") {
      // "outside" is the footprinter default — no explicit position override needed
    } else if (pcbStyle.silkscreenTextPosition === "none") {
      silkscreenTextSx.visibility = "hidden"
    }
  }

  if (Object.keys(silkscreenTextSx).length > 0) {
    sx["& silkscreentext"] = silkscreenTextSx
  }

  if (Object.keys(sx).length === 0) return undefined
  return sx
}
