const PIN_LABEL_EDGE_PADDING = 0.1
const PIN_LABEL_FONT_SIZE = 0.15
const INVERTED_PIN_LABEL_FONT_SCALE = 0.8
const ESTIMATED_PIN_LABEL_CHARACTER_WIDTH = 0.095

/**
 * Approximate advance of one character in ems for the sans-serif font used by
 * the schematic renderer. Most labels are narrower than the per-character
 * estimate; runs of wide glyphs such as M and W are not.
 */
const getCharacterAdvanceInEm = (character: string): number => {
  if (/\s/.test(character)) return 0.28
  if (/[ijl]/.test(character)) return 0.22
  if (/[ft]/.test(character)) return 0.28
  if (character === "r") return 0.33
  if (/[cksvxyz]/.test(character)) return 0.5
  if (character === "m") return 0.83
  if (character === "w") return 0.72
  if (/[I.,:;!'|]/.test(character)) return 0.25
  if (/[MW@%]/.test(character)) return 0.9
  if (/[A-Z]/.test(character)) return 0.67
  return 0.56
}

/**
 * Width of a schematic box whose labelled pins all sit on one vertical side,
 * such as a pin header.
 *
 * The general box sizing reserves room for two facing columns of labels. With
 * a single column that leaves a wide empty band beside the labels, so the box
 * is sized to the labels instead: the longest label plus padding on both
 * sides, and never narrower than the widest label needs to stay inside the
 * box.
 *
 * Returns undefined when there are no labels to size the box from.
 */
export const getSingleColumnSchematicBoxWidth = (
  pinLabels: Array<string | undefined>,
): number | undefined => {
  let widestEstimatedLabel = 0
  let widestGlyphLabel = 0

  for (const pinLabel of pinLabels) {
    if (!pinLabel) continue
    // An N_ prefix is drawn as an overline, in a smaller font, without the prefix.
    const isInverted = pinLabel.startsWith("N_")
    const text = isInverted ? pinLabel.slice(2) : pinLabel
    const characters = Array.from(text)
    if (characters.length === 0) continue
    const fontScale = isInverted ? INVERTED_PIN_LABEL_FONT_SCALE : 1

    widestEstimatedLabel = Math.max(
      widestEstimatedLabel,
      characters.length * ESTIMATED_PIN_LABEL_CHARACTER_WIDTH * fontScale,
    )
    widestGlyphLabel = Math.max(
      widestGlyphLabel,
      characters.reduce(
        (width, character) => width + getCharacterAdvanceInEm(character),
        0,
      ) *
        PIN_LABEL_FONT_SIZE *
        fontScale,
    )
  }

  if (widestEstimatedLabel === 0) return undefined

  return Math.max(
    widestEstimatedLabel + 2 * PIN_LABEL_EDGE_PADDING,
    widestGlyphLabel + PIN_LABEL_EDGE_PADDING,
  )
}
