const FOOTPRINTER_FONT_SIZE_ADJUSTMENT = 0.2
const MIN_FOOTPRINTER_SILKSCREEN_TEXT_FONT_SIZE = 0.6

export const getFootprinterSilkscreenTextFontSize = (
  footprinterFontSize: number,
) =>
  Math.max(
    footprinterFontSize + FOOTPRINTER_FONT_SIZE_ADJUSTMENT,
    MIN_FOOTPRINTER_SILKSCREEN_TEXT_FONT_SIZE,
  )
