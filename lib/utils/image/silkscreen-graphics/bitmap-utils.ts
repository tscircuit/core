import { Resvg } from "@resvg/resvg-js"
import { decode } from "fast-png"
import type {
  Bitmap,
  BunRuntime,
  GraphicTargetSize,
  ImageFormat,
  ImportedGraphicSource,
  Rgba,
} from "./types"

const PIXELS_PER_MM = 24
const MIN_RENDER_DIMENSION_PX = 128
const MAX_RENDER_DIMENSION_PX = 1024
const MIN_VISIBLE_ALPHA = 24
const MIN_BACKGROUND_DISTANCE = 48

const clamp = ({
  unclampedNumber,
  min,
  max,
}: {
  unclampedNumber: number
  min: number
  max: number
}) => Math.max(min, Math.min(max, unclampedNumber))

const normalizeContentType = (contentType: string | undefined) =>
  contentType?.split(";")[0]?.trim().toLowerCase()

export const getImageFormat = (
  graphicSource: ImportedGraphicSource,
): ImageFormat | null => {
  const { contentType, sourceName } = graphicSource
  const normalizedContentType = normalizeContentType(contentType)
  if (normalizedContentType === "image/svg+xml") return "svg"
  if (normalizedContentType === "image/png") return "png"

  const normalizedSourceName = sourceName?.toLowerCase()
  if (normalizedSourceName?.endsWith(".svg")) return "svg"
  if (normalizedSourceName?.endsWith(".png")) return "png"

  return null
}

const getBunRuntime = (): BunRuntime | null => {
  const runtime = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun
  return runtime?.Image ? runtime : null
}

const getSvgRenderTarget = (width: number, height: number) => {
  const longestEdgeMm = Math.max(width, height)
  const longestEdgePixels = clamp({
    unclampedNumber: Math.ceil(longestEdgeMm * PIXELS_PER_MM),
    min: MIN_RENDER_DIMENSION_PX,
    max: MAX_RENDER_DIMENSION_PX,
  })

  return width >= height
    ? { mode: "width" as const, value: longestEdgePixels }
    : { mode: "height" as const, value: longestEdgePixels }
}

const normalizeChannel = ({
  channelSample,
  bitDepth,
}: {
  channelSample: number
  bitDepth: 8 | 16
}) => (bitDepth === 16 ? Math.round(channelSample / 257) : channelSample)

export const decodePngToBitmap = (pngBytes: Uint8Array): Bitmap => {
  const decodedPng = decode(pngBytes)
  const { width, height, channels } = decodedPng
  const bitDepth = decodedPng.depth === 16 ? 16 : 8
  const decodedChannelSamples = decodedPng.data
  const rgbaPixelBuffer = new Uint8Array(width * height * 4)

  for (let index = 0; index < width * height; index++) {
    const sourceOffset = index * channels
    const targetOffset = index * 4

    if (channels === 1) {
      const grayscaleChannel = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset]!,
        bitDepth,
      })
      rgbaPixelBuffer[targetOffset] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 1] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 2] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 3] = 255
      continue
    }

    if (channels === 2) {
      const grayscaleChannel = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset]!,
        bitDepth,
      })
      rgbaPixelBuffer[targetOffset] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 1] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 2] = grayscaleChannel
      rgbaPixelBuffer[targetOffset + 3] = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset + 1]!,
        bitDepth,
      })
      continue
    }

    if (channels === 3 || channels === 4) {
      rgbaPixelBuffer[targetOffset] = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset]!,
        bitDepth,
      })
      rgbaPixelBuffer[targetOffset + 1] = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset + 1]!,
        bitDepth,
      })
      rgbaPixelBuffer[targetOffset + 2] = normalizeChannel({
        channelSample: decodedChannelSamples[sourceOffset + 2]!,
        bitDepth,
      })
      rgbaPixelBuffer[targetOffset + 3] =
        channels === 4
          ? normalizeChannel({
              channelSample: decodedChannelSamples[sourceOffset + 3]!,
              bitDepth,
            })
          : 255
      continue
    }

    throw new Error(
      `Unsupported PNG channel count "${channels}" for silkscreen conversion`,
    )
  }

  return {
    width,
    height,
    rgbaPixels: rgbaPixelBuffer,
  }
}

const renderSvgToBitmap = ({
  svgText,
  targetSize,
}: {
  svgText: string
  targetSize: GraphicTargetSize
}): Bitmap => {
  const pngBytes = new Resvg(svgText, {
    fitTo: getSvgRenderTarget(targetSize.width, targetSize.height),
  })
    .render()
    .asPng()

  return decodePngToBitmap(pngBytes)
}

const convertRasterToBitmap = async ({
  imageBytes,
  contentType,
}: {
  imageBytes: Uint8Array
  contentType: string | undefined
}): Promise<Bitmap> => {
  const normalizedContentType = normalizeContentType(contentType)
  if (normalizedContentType === "image/png") {
    return decodePngToBitmap(imageBytes)
  }

  const bunRuntime = getBunRuntime()
  if (!bunRuntime) {
    throw new Error(
      `Unsupported silkscreen graphic format "${contentType ?? "unknown"}". Use SVG or PNG when Bun image codecs are unavailable.`,
    )
  }

  const pngBytes = await new bunRuntime.Image(imageBytes).png().bytes()
  return decodePngToBitmap(pngBytes)
}

const getPixel = ({
  bitmap,
  x,
  y,
}: {
  bitmap: Bitmap
  x: number
  y: number
}): Rgba => {
  const offset = (y * bitmap.width + x) * 4
  return {
    r: bitmap.rgbaPixels[offset]!,
    g: bitmap.rgbaPixels[offset + 1]!,
    b: bitmap.rgbaPixels[offset + 2]!,
    a: bitmap.rgbaPixels[offset + 3]!,
  }
}

const getBackgroundColor = (bitmap: Bitmap): Rgba => {
  const samples = [
    getPixel({ bitmap, x: 0, y: 0 }),
    getPixel({ bitmap, x: bitmap.width - 1, y: 0 }),
    getPixel({ bitmap, x: 0, y: bitmap.height - 1 }),
    getPixel({ bitmap, x: bitmap.width - 1, y: bitmap.height - 1 }),
  ]

  return {
    r: Math.round(samples.reduce((sum, sample) => sum + sample.r, 0) / 4),
    g: Math.round(samples.reduce((sum, sample) => sum + sample.g, 0) / 4),
    b: Math.round(samples.reduce((sum, sample) => sum + sample.b, 0) / 4),
    a: Math.round(samples.reduce((sum, sample) => sum + sample.a, 0) / 4),
  }
}

const rgbaDistance = (a: Rgba, b: Rgba) =>
  Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2 + (a.a - b.a) ** 2,
  )

export const createFilledMask = (bitmap: Bitmap): boolean[] => {
  // Use the corner color as the background reference so transparent SVGs and
  // black-on-white raster logos both collapse into a binary silkscreen mask.
  const background = getBackgroundColor(bitmap)
  const filledMask = new Array<boolean>(bitmap.width * bitmap.height)

  for (let y = 0; y < bitmap.height; y++) {
    for (let x = 0; x < bitmap.width; x++) {
      const pixel = getPixel({ bitmap, x, y })
      const isVisible = pixel.a >= MIN_VISIBLE_ALPHA
      const differsFromBackground =
        rgbaDistance(pixel, background) >= MIN_BACKGROUND_DISTANCE

      filledMask[y * bitmap.width + x] =
        isVisible && (background.a < MIN_VISIBLE_ALPHA || differsFromBackground)
    }
  }

  return filledMask
}

export const imageBytesToBitmap = async ({
  imageBytes,
  graphicSource,
  targetSize,
}: {
  imageBytes: Uint8Array
  graphicSource: ImportedGraphicSource
  targetSize: GraphicTargetSize
}): Promise<Bitmap> => {
  const format = getImageFormat(graphicSource)

  if (format === "svg") {
    const svgText = new TextDecoder().decode(imageBytes)
    return renderSvgToBitmap({ svgText, targetSize })
  }

  if (format === "png") {
    return decodePngToBitmap(imageBytes)
  }

  return convertRasterToBitmap({
    imageBytes,
    contentType: graphicSource.contentType,
  })
}
