import {
  glyphAdvanceRatio,
  glyphWidthRatio,
  letterSpacingRatio,
  lineAlphabet,
  lineHeightRatio,
  spaceWidthRatio,
  strokeWidthRatio,
} from "@tscircuit/alphabet"
import {
  type Bounds,
  type Point,
  getBoundsFromPoints,
} from "@tscircuit/math-utils"
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

/**
 * Lays out one line like the Gerber writer, from the lower-left corner of its
 * glyph box. Returns its advance width and the extent of its strokes'
 * centerlines, null when it draws nothing.
 */
const layOutLine = (line: string, fontSize: number) => {
  const glyphScale = fontSize * GLYPH_BOX_HEIGHT_RATIO
  const characters = [...line]
  let x = 0
  const strokeEnds: Point[] = []
  characters.forEach((character, i) => {
    for (const { x1, y1, x2, y2 } of lineAlphabet[character] ?? []) {
      strokeEnds.push(
        { x: x + x1 * glyphScale, y: y1 * glyphScale },
        { x: x + x2 * glyphScale, y: y2 * glyphScale },
      )
    }
    const advanceRatio =
      character === " "
        ? spaceWidthRatio
        : (glyphAdvanceRatio[character] ?? glyphWidthRatio)
    x += advanceRatio * fontSize
    if (i < characters.length - 1) x += letterSpacingRatio * fontSize
  })
  return { width: x, ink: getBoundsFromPoints(strokeEnds) }
}

// circuit-to-svg lays knockout text out apart: full-size glyphs squashed to
// 0.94 of their height, each in a box as wide as the widest glyph, every line
// centered and 1.1 font sizes below the one above
const KNOCKOUT_GLYPH_HEIGHT_RATIO = 0.94
const KNOCKOUT_LINE_HEIGHT_RATIO = 1.1
const knockoutGlyphInkByCharacter = new Map<string, Bounds>(
  Object.entries(lineAlphabet).flatMap(([character, segments]) => {
    const strokeExtent = getBoundsFromPoints(
      segments.flatMap(({ x1, y1, x2, y2 }) => [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ]),
    )
    if (!strokeExtent) return []
    const halfStrokeWidth = strokeWidthRatio / 2
    return [
      [
        character,
        {
          minX: strokeExtent.minX - halfStrokeWidth,
          minY:
            (strokeExtent.minY - halfStrokeWidth) * KNOCKOUT_GLYPH_HEIGHT_RATIO,
          maxX: strokeExtent.maxX + halfStrokeWidth,
          maxY:
            (strokeExtent.maxY + halfStrokeWidth) * KNOCKOUT_GLYPH_HEIGHT_RATIO,
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
  const inkCorners: Point[] = []
  for (const [lineIndex, line] of text.split("\n").entries()) {
    const characters = [...line]
    const lineMinX = (-characters.length * KNOCKOUT_GLYPH_ADVANCE_RATIO) / 2
    const lineOffsetY = -lineIndex * KNOCKOUT_LINE_HEIGHT_RATIO
    for (const [i, character] of characters.entries()) {
      const glyphInk = knockoutGlyphInkByCharacter.get(character)
      if (!glyphInk) continue
      const offsetX = lineMinX + i * KNOCKOUT_GLYPH_ADVANCE_RATIO
      inkCorners.push(
        { x: offsetX + glyphInk.minX, y: lineOffsetY + glyphInk.minY },
        { x: offsetX + glyphInk.maxX, y: lineOffsetY + glyphInk.maxY },
      )
    }
  }
  const ink = getBoundsFromPoints(inkCorners)
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
  const inkCorners: Point[] = []
  const glyphBoxCorners: Point[] = []
  text.text.split("\n").forEach((line, lineIndex) => {
    const { width, ink: lineInk } = layOutLine(line, fontSize)
    const offsetX = getAlignedMinX(width)
    const offsetY =
      firstGlyphBoxTop - glyphBoxHeight - lineIndex * lineHeightRatio * fontSize
    glyphBoxCorners.push(
      { x: offsetX, y: offsetY },
      { x: offsetX + width, y: offsetY + glyphBoxHeight },
    )
    if (!lineInk) return
    inkCorners.push(
      {
        x: offsetX + lineInk.minX - halfStrokeWidth,
        y: offsetY + lineInk.minY - halfStrokeWidth,
      },
      {
        x: offsetX + lineInk.maxX + halfStrokeWidth,
        y: offsetY + lineInk.maxY + halfStrokeWidth,
      },
    )
  })
  let local: Bounds =
    getBoundsFromPoints(inkCorners) ?? getBoundsFromPoints(glyphBoxCorners)!

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

  // Same transform as circuit-to-svg, in the board's y-up frame
  const isMirrored = text.layer === "bottom" || text.is_mirrored === true
  const textToBoard = compose(
    translate(text.anchor_position.x, text.anchor_position.y),
    rotateDEG(text.ccw_rotation ?? 0),
    isMirrored ? scale(-1, 1) : identity(),
  )
  const board = getBoundsFromPoints(
    applyToPoints(textToBoard, [
      { x: local.minX, y: local.minY },
      { x: local.maxX, y: local.minY },
      { x: local.minX, y: local.maxY },
      { x: local.maxX, y: local.maxY },
    ]),
  )!
  return {
    x: board.minX,
    y: board.minY,
    width: board.maxX - board.minX,
    height: board.maxY - board.minY,
  }
}
