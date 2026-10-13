import { getSchematicTextWidth } from "./getSchematicTextWidth"

// Regular Arial advance widths in hundredths of an em, indexed by ASCII code
// minus 32 (space through ~). Only these 95 numbers are needed for routing.
// Metric data: string-pixel-width 1.11.0, Adam Bisek (MIT).
// https://github.com/adambisek/string-pixel-width/blob/master/src/widthsMap.js
const ASCII_ADVANCES = [
  28, 28, 35, 56, 56, 89, 67, 19, 33, 33, 39, 58, 28, 33, 28, 28, 56, 56, 56,
  56, 56, 56, 56, 56, 56, 56, 28, 28, 58, 58, 58, 56, 102, 67, 67, 72, 72, 67,
  61, 78, 72, 28, 50, 67, 56, 83, 72, 78, 67, 78, 72, 67, 61, 72, 67, 94, 67,
  67, 61, 28, 28, 28, 47, 56, 33, 56, 56, 50, 56, 56, 28, 56, 56, 22, 22, 50,
  22, 83, 56, 56, 56, 56, 33, 50, 28, 56, 50, 72, 50, 50, 50, 33, 26, 33, 58,
]

/** Horizontal routing obstacle width in schematic millimeters, before anchoring/rotation. */
export function getSchematicTextObstacleWidth({
  text,
  fontSize,
}: {
  text: string
  fontSize: number
}) {
  let totalAdvance = 0
  for (const character of text) {
    const advance = ASCII_ADVANCES[character.charCodeAt(0) - 32]
    // Preserve the previous estimate when the font table has no measurement.
    if (advance === undefined) {
      return getSchematicTextWidth({ text, fontSize })
    }
    totalAdvance += advance
  }

  return totalAdvance * (fontSize / 100)
}
