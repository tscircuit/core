import type { PcbSilkscreenText } from "circuit-json"
import {
  applyToPoints,
  compose,
  identity,
  rotateDEG,
  scale,
  translate,
} from "transformation-matrix"

const CHARACTER_WIDTH_RATIO = 0.6

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
 * Bounding box of PCB silkscreen text as circuit-to-svg draws it, in the board
 * frame (mm, +Y up): `top_*` text hangs below its anchor, extra lines go down,
 * bottom-layer or `is_mirrored` text is mirrored, and rotation is about the
 * anchor. Knockout text covers its padded fill, which is aligned as a whole.
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
  const lines = text.text.split("\n")
  const textWidth =
    Math.max(...lines.map((line) => line.length)) *
    fontSize *
    CHARACTER_WIDTH_RATIO
  const anchorAlignment = text.anchor_alignment ?? "center"
  // circuit-to-svg's default knockout padding
  const padding = text.is_knockout
    ? {
        left: text.knockout_padding?.left ?? fontSize * 0.5,
        right: text.knockout_padding?.right ?? fontSize * 0.5,
        top: text.knockout_padding?.top ?? fontSize * 0.3,
        bottom: text.knockout_padding?.bottom ?? fontSize * 0.3,
      }
    : { left: 0, right: 0, top: 0, bottom: 0 }
  const boxWidth = textWidth + padding.left + padding.right
  const boxHeight = lines.length * fontSize + padding.top + padding.bottom
  // Plain text is aligned on its first line
  const alignedHeight = text.is_knockout ? boxHeight : fontSize

  // Extent of the text relative to its anchor, before mirroring and rotation.
  const minX = anchorAlignment.endsWith("_left")
    ? 0
    : anchorAlignment.endsWith("_right")
      ? -boxWidth
      : -boxWidth / 2
  const maxY = anchorAlignment.startsWith("top_")
    ? 0
    : anchorAlignment.startsWith("bottom_")
      ? alignedHeight
      : alignedHeight / 2
  const localCorners = [
    { x: minX, y: maxY - boxHeight },
    { x: minX + boxWidth, y: maxY - boxHeight },
    { x: minX, y: maxY },
    { x: minX + boxWidth, y: maxY },
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
