import { ensureClockwise } from "@tscircuit/image-utils"
import type { PcbSilkscreenGraphic } from "circuit-json"
import { convertIndexedToRgb, decode } from "fast-png"
import {
  type Matrix,
  applyToPoint,
  compose,
  scale,
  translate,
} from "transformation-matrix"

const REC709_LUMINANCE_WEIGHTS = { red: 0.2126, green: 0.7152, blue: 0.0722 }

/** Convert dark pixels composited on white to ink. Pixel +Y is down; output
 * points are board-space mm (+X right, +Y up), through the primitive transform. */
export function getPngSilkscreenShapes({
  pngBytes,
  width,
  height,
  transform,
}: {
  pngBytes: Uint8Array
  width: number
  height: number
  transform: Matrix
}): PcbSilkscreenGraphic["brep_shape"][] {
  const png = decode(pngBytes)
  let samples = png.data
  let channels = png.channels
  let depth = png.depth
  if (png.palette) {
    samples = convertIndexedToRgb(png)
    channels = png.palette[0]!.length
    depth = 8
  }
  const maximumSample = 2 ** depth - 1
  const inkThreshold = 0.5
  const rectangles: Array<{
    left: number
    right: number
    top: number
    bottom: number
  }> = []
  let previousRow = new Map<number, (typeof rectangles)[number]>()
  for (let y = 0; y < png.height; y++) {
    const currentRow = new Map<number, (typeof rectangles)[number]>()
    let runStart = -1
    for (let x = 0; x <= png.width; x++) {
      let isInk = false
      if (x < png.width) {
        const offset = (y * png.width + x) * channels
        let red = samples[offset]!
        let green = red
        let blue = red
        let alpha = maximumSample
        if (depth < 8) {
          const rowBytes = Math.ceil((png.width * depth) / 8)
          const byte = samples[y * rowBytes + Math.floor((x * depth) / 8)]!
          red = (byte >> (8 - depth - ((x * depth) % 8))) & maximumSample
          green = red
          blue = red
        } else if (channels >= 3) {
          green = samples[offset + 1]!
          blue = samples[offset + 2]!
        }
        if (channels === 2 || channels === 4) {
          alpha = samples[offset + channels - 1]!
        } else if (
          png.transparency &&
          red === png.transparency[0] &&
          (channels === 1 ||
            (green === png.transparency[1] && blue === png.transparency[2]))
        ) {
          alpha = 0
        }
        const luminance =
          (REC709_LUMINANCE_WEIGHTS.red * red +
            REC709_LUMINANCE_WEIGHTS.green * green +
            REC709_LUMINANCE_WEIGHTS.blue * blue) /
          maximumSample
        isInk = (1 - luminance) * (alpha / maximumSample) > inkThreshold
      }
      if (isInk && runStart === -1) runStart = x
      if (!isInk && runStart !== -1) {
        let rectangle = previousRow.get(runStart)
        if (rectangle?.right === x) {
          rectangle.bottom = y + 1
        } else {
          rectangle = { left: runStart, right: x, top: y, bottom: y + 1 }
          rectangles.push(rectangle)
        }
        currentRow.set(runStart, rectangle)
        runStart = -1
      }
    }
    previousRow = currentRow
  }
  const pixelToBoard = compose(
    transform,
    translate(-width / 2, height / 2),
    scale(width / png.width, -height / png.height),
  )
  return rectangles.map(({ left, right, top, bottom }) => ({
    outer_ring: {
      vertices: ensureClockwise(
        [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ].map((point) => applyToPoint(pixelToBoard, point)),
      ),
    },
    inner_rings: [],
  }))
}
