import {
  glyphAdvanceRatio,
  glyphWidthRatio,
  letterSpacingRatio,
  lineAlphabet,
  lineHeightRatio,
  spaceWidthRatio,
  strokeWidthRatio,
} from "@tscircuit/alphabet"
import type { PcbSilkscreenText } from "circuit-json"
import {
  applyToPoints,
  compose,
  identity,
  rotateDEG,
  scale,
  translate,
} from "transformation-matrix"

// The Gerber writer scales each glyph to 0.7 font sizes and draws it from the
// bottom of a box that tall
const GLYPH_BOX_HEIGHT_RATIO = 0.7

interface LocalBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const getBoundsUnion = (a: LocalBounds | null, b: LocalBounds) =>
  a
    ? {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY),
      }
    : b

/**
 * Lays out one line like the Gerber writer, from the lower-left corner of its
 * glyph box. Returns its advance width and the extent of its strokes'
 * centerlines, null when it draws nothing.
 */
const layOutLine = (line: string, fontSize: number) => {
  const glyphScale = fontSize * GLYPH_BOX_HEIGHT_RATIO
  const characters = [...line]
  let x = 0
  let ink: LocalBounds | null = null
  characters.forEach((character, i) => {
    for (const { x1, y1, x2, y2 } of lineAlphabet[character] ?? []) {
      ink = getBoundsUnion(ink, {
        minX: x + Math.min(x1, x2) * glyphScale,
        minY: Math.min(y1, y2) * glyphScale,
        maxX: x + Math.max(x1, x2) * glyphScale,
        maxY: Math.max(y1, y2) * glyphScale,
      })
    }
    const advanceRatio =
      character === " "
        ? spaceWidthRatio
        : (glyphAdvanceRatio[character] ?? glyphWidthRatio)
    x += advanceRatio * fontSize
    if (i < characters.length - 1) x += letterSpacingRatio * fontSize
  })
  return { width: x, ink: ink as LocalBounds | null }
}

// circuit-to-svg lays knockout text out apart: full-size glyphs squashed to
// 0.94 of their height, each in a box as wide as the widest glyph, every line
// centered and 1.1 font sizes below the one above
const KNOCKOUT_GLYPH_HEIGHT_RATIO = 0.94
const KNOCKOUT_LINE_HEIGHT_RATIO = 1.1
const knockoutGlyphInkByCharacter = new Map<string, LocalBounds>(
  Object.entries(lineAlphabet).flatMap(([character, segments]) => {
    if (segments.length === 0) return []
    const xs = segments.flatMap(({ x1, x2 }) => [x1, x2])
    const ys = segments.flatMap(({ y1, y2 }) => [y1, y2])
    const halfStrokeWidth = strokeWidthRatio / 2
    return [
      [
        character,
        {
          minX: Math.min(...xs) - halfStrokeWidth,
          minY:
            (Math.min(...ys) - halfStrokeWidth) * KNOCKOUT_GLYPH_HEIGHT_RATIO,
          maxX: Math.max(...xs) + halfStrokeWidth,
          maxY:
            (Math.max(...ys) + halfStrokeWidth) * KNOCKOUT_GLYPH_HEIGHT_RATIO,
        },
      ],
    ]
  }),
)
const KNOCKOUT_GLYPH_ADVANCE_RATIO =
  Math.round(
    Math.max(
      ...[...knockoutGlyphInkByCharacter.values()].map(
        (glyphInk) => glyphInk.maxX - glyphInk.minX,
      ),
    ) * 1000,
  ) / 1000

/**
 * Size of the ink of knockout text laid out like circuit-to-svg does, null
 * when it draws nothing.
 */
const getKnockoutInkSize = (text: string, fontSize: number) => {
  let ink: LocalBounds | null = null
  for (const [lineIndex, line] of text.split("\n").entries()) {
    const characters = [...line]
    const lineMinX = (-characters.length * KNOCKOUT_GLYPH_ADVANCE_RATIO) / 2
    const lineOffsetY = -lineIndex * KNOCKOUT_LINE_HEIGHT_RATIO
    for (const [i, character] of characters.entries()) {
      const glyphInk = knockoutGlyphInkByCharacter.get(character)
      if (!glyphInk) continue
      const offsetX = lineMinX + i * KNOCKOUT_GLYPH_ADVANCE_RATIO
      ink = getBoundsUnion(ink, {
        minX: offsetX + glyphInk.minX,
        minY: lineOffsetY + glyphInk.minY,
        maxX: offsetX + glyphInk.maxX,
        maxY: lineOffsetY + glyphInk.maxY,
      })
    }
  }
  if (!ink) return null
  return {
    width: (ink.maxX - ink.minX) * fontSize,
    height: (ink.maxY - ink.minY) * fontSize,
  }
}

/** The fields that set where PCB text is drawn. */
export type PcbTextLayout = Pick<
  PcbSilkscreenText,
  "text" | "font_size" | "anchor_position" | "anchor_alignment"
> &
  Partial<
    Pick<
      PcbSilkscreenText,
      | "ccw_rotation"
      | "layer"
      | "is_mirrored"
      | "is_knockout"
      | "knockout_padding"
    >
  >

/**
 * Bounding box of the silkscreen the text prints, in the board frame (mm, +Y
 * up): its glyph strokes as the Gerber writer draws them with the tscircuit
 * alphabet, stroke width included. Glyphs sit low in their box, so centered
 * text reaches further below its anchor than above. Each line is aligned on
 * the anchor like circuit-to-svg does: `top_*` text hangs below it, extra
 * lines go down, bottom-layer or `is_mirrored` text is mirrored, and rotation
 * is about the anchor. Knockout text covers its padded fill, which
 * circuit-to-svg lays out apart and aligns on the anchor as a whole.
 *
 * @returns Bounding box with { x, y, width, height }, (x, y) being its lower-left corner
 */
export function getPcbTextBounds(text: PcbTextLayout): {
  x: number
  y: number
  width: number
  height: number
} {
  const fontSize = text.font_size
  const anchorAlignment = text.anchor_alignment ?? "center"
  const getAlignedMinX = (width: number) =>
    anchorAlignment.endsWith("_left")
      ? 0
      : anchorAlignment.endsWith("_right")
        ? -width
        : -width / 2
  const getAlignedMaxY = (height: number) =>
    anchorAlignment.startsWith("top_")
      ? 0
      : anchorAlignment.startsWith("bottom_")
        ? height
        : height / 2

  // Ink of every line relative to the anchor, before mirroring and rotation;
  // text that draws nothing covers its glyph boxes
  const glyphBoxHeight = fontSize * GLYPH_BOX_HEIGHT_RATIO
  const firstGlyphBoxTop = getAlignedMaxY(glyphBoxHeight)
  const halfStrokeWidth = (fontSize * strokeWidthRatio) / 2
  let ink: LocalBounds | null = null
  let glyphBoxes: LocalBounds | null = null
  text.text.split("\n").forEach((line, lineIndex) => {
    const { width, ink: lineInk } = layOutLine(line, fontSize)
    const offsetX = getAlignedMinX(width)
    const offsetY =
      firstGlyphBoxTop - glyphBoxHeight - lineIndex * lineHeightRatio * fontSize
    glyphBoxes = getBoundsUnion(glyphBoxes, {
      minX: offsetX,
      minY: offsetY,
      maxX: offsetX + width,
      maxY: offsetY + glyphBoxHeight,
    })
    if (!lineInk) return
    ink = getBoundsUnion(ink, {
      minX: offsetX + lineInk.minX - halfStrokeWidth,
      minY: offsetY + lineInk.minY - halfStrokeWidth,
      maxX: offsetX + lineInk.maxX + halfStrokeWidth,
      maxY: offsetY + lineInk.maxY + halfStrokeWidth,
    })
  })
  let local: LocalBounds = ink ?? glyphBoxes!

  const knockoutInkSize = text.is_knockout
    ? getKnockoutInkSize(text.text, fontSize)
    : null
  if (knockoutInkSize) {
    // circuit-to-svg's default knockout padding
    const width =
      knockoutInkSize.width +
      (text.knockout_padding?.left ?? fontSize * 0.5) +
      (text.knockout_padding?.right ?? fontSize * 0.5)
    const height =
      knockoutInkSize.height +
      (text.knockout_padding?.top ?? fontSize * 0.3) +
      (text.knockout_padding?.bottom ?? fontSize * 0.3)
    const minX = getAlignedMinX(width)
    const maxY = getAlignedMaxY(height)
    local = { minX, minY: maxY - height, maxX: minX + width, maxY }
  }

  const localCorners = [
    { x: local.minX, y: local.minY },
    { x: local.maxX, y: local.minY },
    { x: local.minX, y: local.maxY },
    { x: local.maxX, y: local.maxY },
  ]

  // Same transform as circuit-to-svg, in the board's y-up frame
  const isMirrored = text.layer === "bottom" || text.is_mirrored === true
  const textToBoard = compose(
    translate(text.anchor_position.x, text.anchor_position.y),
    rotateDEG(text.ccw_rotation ?? 0),
    isMirrored ? scale(-1, 1) : identity(),
  )
  const boardCorners = applyToPoints(textToBoard, localCorners)
  const boardMinX = Math.min(...boardCorners.map((corner) => corner.x))
  const boardMaxX = Math.max(...boardCorners.map((corner) => corner.x))
  const boardMinY = Math.min(...boardCorners.map((corner) => corner.y))
  const boardMaxY = Math.max(...boardCorners.map((corner) => corner.y))
  return {
    x: boardMinX,
    y: boardMinY,
    width: boardMaxX - boardMinX,
    height: boardMaxY - boardMinY,
  }
}
