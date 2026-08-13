const DEFAULT_SECTION_TITLE_FONT_SIZE = 0.18

export const getSchematicSectionLabelSize = ({
  displayName,
  sectionTitleFontSize,
}: {
  displayName?: string
  sectionTitleFontSize?: number
}): { width: number; height: number } => {
  if (!displayName) return { width: 0, height: 0 }

  const fontSize = sectionTitleFontSize ?? DEFAULT_SECTION_TITLE_FONT_SIZE

  // Schematic text is rendered with a proportional sans-serif font. Using a
  // conservative average glyph width keeps section labels from extending into
  // adjacent cells without requiring a browser text-measurement API in core.
  return {
    width: displayName.length * fontSize * 0.65,
    height: fontSize,
  }
}
