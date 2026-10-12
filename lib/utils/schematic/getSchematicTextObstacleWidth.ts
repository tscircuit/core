import getTextWidth from "string-pixel-width"
import { getSchematicTextWidth } from "./getSchematicTextWidth"

/** Horizontal routing obstacle width in schematic millimeters, before anchoring/rotation. */
export function getSchematicTextObstacleWidth({
  text,
  fontSize,
}: {
  text: string
  fontSize: number
}) {
  // circuit-to-svg renders schematic text with font-family="sans-serif".
  // Arial advances approximate that proportional font without requiring a DOM
  // or a canvas, so browser and server routing use the same measurements.
  // The metrics cover printable ASCII. Preserve the previous estimate for
  // other text instead of using the library's narrower unknown-glyph fallback.
  if (/[^\x20-\x7e]/.test(text)) {
    return getSchematicTextWidth({ text, fontSize })
  }

  return getTextWidth(text, { font: "arial", size: fontSize })
}
