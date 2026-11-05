import { distance, type PcbCopperText } from "circuit-json"
import type { RotatedRect } from "./generateApproximatingRects"
import type { Obstacle } from "./types"

const CHAR_WIDTH = 1
const CHAR_SPACING = 0.2
const LINE_HEIGHT = 1.4
const FONT_SCALE = 0.53
const QUARTER_TURN_TOLERANCE_DEGREES = 0.01

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// Per-character normalized [minX, minY, maxX, maxY] bounds in SVG local space
// (x in [0, 1], y = 1 - glyphY in [0, 1]) from @tscircuit/alphabet lineAlphabet.
const GLYPH_BOUNDS: Record<string, readonly [number, number, number, number]> =
  {
    "0": [0.064942, 0.257813, 0.537111, 0.961214],
    "1": [0.220426, 0.270996, 0.381626, 0.948966],
    "2": [0.07959, 0.257813, 0.522462, 0.948045],
    "3": [0.071046, 0.257813, 0.531007, 0.961214],
    "4": [0.048828, 0.270996, 0.553224, 0.94897],
    "5": [0.074951, 0.270996, 0.527101, 0.962139],
    "6": [0.064942, 0.257813, 0.537111, 0.961214],
    "7": [0.071534, 0.270996, 0.530519, 0.94897],
    "8": [0.063965, 0.257813, 0.538087, 0.961214],
    "9": [0.091026, 0.257813, 0.511026, 0.957812],
    "!": [0.251466, 0.270996, 0.350587, 0.94897],
    '"': [0.16504, 0.270996, 0.437013, 0.523022],
    "#": [0.001465, 0.282227, 0.600587, 0.949754],
    $: [0.07544, 0.240234, 0.526613, 1.083502],
    "'": [0.301026, 0.270996, 0.301026, 0.523022],
    "(": [0.188966, 0.241211, 0.413087, 1.069491],
    ")": [0.188966, 0.241211, 0.413087, 1.069491],
    "*": [0.081055, 0.257813, 0.520997, 0.681942],
    "+": [0.042969, 0.428223, 0.559083, 0.908661],
    ",": [0.215333, 0.852051, 0.38672, 1.119971],
    "-": [0.173829, 0.686035, 0.428224, 0.686035],
    ".": [0.239503, 0.851074, 0.362549, 0.851074],
    "/": [0.062501, 0.270996, 0.539551, 1.035249],
    "<": [0.042969, 0.441895, 0.559083, 0.896902],
    "=": [0.042969, 0.545898, 0.559083, 0.80837],
    ">": [0.042969, 0.441895, 0.559083, 0.896902],
    A: [0.018067, 0.270996, 0.583986, 0.94897],
    B: [0.063965, 0.270996, 0.538087, 0.94897],
    C: [0.072998, 0.257813, 0.529054, 0.961214],
    D: [0.064454, 0.270996, 0.537599, 0.94897],
    E: [0.080078, 0.270996, 0.521974, 0.94897],
    F: [0.086426, 0.270996, 0.515626, 0.94897],
    G: [0.056397, 0.257813, 0.545656, 0.961214],
    H: [0.066895, 0.270996, 0.535157, 0.94897],
    I: [0.301026, 0.270996, 0.301026, 0.94897],
    J: [0.094239, 0.270996, 0.507814, 0.962139],
    K: [0.035401, 0.270996, 0.566652, 0.94897],
    L: [0.07544, 0.270996, 0.526613, 0.94897],
    M: [0.042481, 0.270996, 0.559571, 0.94897],
    N: [0.067871, 0.270996, 0.534181, 0.94897],
    O: [0.057129, 0.257813, 0.544923, 0.961214],
    P: [0.070557, 0.270996, 0.531496, 0.94897],
    Q: [0.057129, 0.257813, 0.544923, 1.070653],
    R: [0.034912, 0.270996, 0.56714, 0.94897],
    S: [0.066895, 0.257813, 0.535157, 0.961214],
    T: [0.022949, 0.270996, 0.579103, 0.94897],
    U: [0.072022, 0.270996, 0.530031, 0.962139],
    V: [0.027832, 0.270996, 0.57422, 0.94897],
    W: [0, 0.270996, 0.602052, 0.94897],
    X: [0.009034, 0.270996, 0.593019, 0.94897],
    Y: [0.018067, 0.270996, 0.583986, 0.94897],
    Z: [0.053711, 0.270996, 0.548341, 0.94897],
    "[": [0.197511, 0.240234, 0.404542, 1.069424],
    "\\": [0.062501, 0.270996, 0.539551, 1.035249],
    "]": [0.19751, 0.240234, 0.404542, 1.069424],
    "^": [0.035156, 0.270996, 0.566896, 0.523931],
    _: [0, 1.160601, 0.602052, 1.160601],
    a: [0.074951, 0.439941, 0.527101, 0.973965],
    b: [0.07666, 0.240234, 0.525392, 0.959985],
    c: [0.0896, 0.439941, 0.512452, 0.973965],
    d: [0.076661, 0.240234, 0.525392, 0.959985],
    e: [0.059571, 0.439941, 0.542482, 0.973965],
    f: [0.089112, 0.240234, 0.512941, 0.946817],
    g: [0.076661, 0.439941, 0.525392, 1.160601],
    h: [0.092041, 0.240234, 0.510011, 0.946817],
    i: [0.261026, 0.240234, 0.341026, 0.946817],
    j: [0.15503, 0.240234, 0.447023, 1.140264],
    k: [0.065186, 0.240234, 0.536867, 0.946817],
    l: [0.301026, 0.234863, 0.301026, 0.946441],
    m: [0.050538, 0.439941, 0.551515, 0.960796],
    n: [0.092041, 0.439941, 0.510011, 0.960796],
    o: [0.066895, 0.439941, 0.535157, 0.973965],
    p: [0.076904, 0.439941, 0.525148, 1.154244],
    q: [0.076905, 0.441895, 0.525148, 1.156195],
    r: [0.107422, 0.439941, 0.49463, 0.960796],
    s: [0.101563, 0.439941, 0.50049, 0.973965],
    t: [0.081055, 0.297852, 0.520997, 0.950848],
    u: [0.092041, 0.454102, 0.510011, 0.974954],
    v: [0.048828, 0.453125, 0.553224, 0.961719],
    w: [0, 0.453125, 0.602052, 0.961719],
    x: [0.03711, 0.453125, 0.564943, 0.961719],
    y: [0.044922, 0.453125, 0.55713, 1.155166],
    z: [0.09668, 0.452148, 0.505373, 0.961651],
  }

const getLineWidth = (
  line: string,
  charAdvance: number,
  spaceAdvance: number,
  trailingSpacing: number,
) => {
  let width = 0
  for (const char of line) {
    width += char === " " ? spaceAdvance : charAdvance
  }
  return width > 0 ? width - trailingSpacing : 0
}

const getHorizontalAnchorPosition = (
  anchorAlignment: string,
  bounds: Bounds,
) => {
  if (
    anchorAlignment === "top_left" ||
    anchorAlignment === "center_left" ||
    anchorAlignment === "bottom_left"
  ) {
    return bounds.minX
  }
  if (
    anchorAlignment === "top_right" ||
    anchorAlignment === "center_right" ||
    anchorAlignment === "bottom_right"
  ) {
    return bounds.maxX
  }
  return (bounds.minX + bounds.maxX) / 2
}

const getVerticalAnchorPosition = (anchorAlignment: string, bounds: Bounds) => {
  if (
    anchorAlignment === "top_left" ||
    anchorAlignment === "top_center" ||
    anchorAlignment === "top_right"
  ) {
    return bounds.minY
  }
  if (
    anchorAlignment === "bottom_left" ||
    anchorAlignment === "bottom_center" ||
    anchorAlignment === "bottom_right"
  ) {
    return bounds.maxY
  }
  return (bounds.minY + bounds.maxY) / 2
}

const getAnchorOffsetForBounds = (anchorAlignment: string, bounds: Bounds) => ({
  x: -getHorizontalAnchorPosition(anchorAlignment, bounds),
  y: -getVerticalAnchorPosition(anchorAlignment, bounds),
})

const translateBounds = (
  bounds: Bounds,
  offset: { x: number; y: number },
): Bounds => ({
  minX: bounds.minX + offset.x,
  minY: bounds.minY + offset.y,
  maxX: bounds.maxX + offset.x,
  maxY: bounds.maxY + offset.y,
})

const getAxisAlignedRectFromRotatedRect = (
  rotatedRect: RotatedRect,
): {
  center: { x: number; y: number }
  width: number
  height: number
} | null => {
  const normalizedRotation = ((rotatedRect.rotation % 360) + 360) % 360
  const axisAlignedAngles = [0, 90, 180, 270] as const

  for (const angle of axisAlignedAngles) {
    const angularDistance = Math.min(
      Math.abs(normalizedRotation - angle),
      360 - Math.abs(normalizedRotation - angle),
    )

    if (angularDistance > QUARTER_TURN_TOLERANCE_DEGREES) continue

    const isVertical = angle === 90 || angle === 270

    return {
      center: rotatedRect.center,
      width: isVertical ? rotatedRect.height : rotatedRect.width,
      height: isVertical ? rotatedRect.width : rotatedRect.height,
    }
  }

  return null
}

export const getObstaclesFromPcbCopperText = (
  copperText: PcbCopperText,
  componentId?: string,
): Obstacle[] => {
  const {
    anchor_position,
    text,
    font_size = 0.2,
    layer = "top",
    ccw_rotation = 0,
    anchor_alignment = "center",
    is_knockout = false,
    knockout_padding,
    is_mirrored = false,
  } = copperText

  if (!anchor_position || !text) return []

  const fontSizeNum =
    typeof font_size === "number"
      ? font_size
      : (distance.parse(font_size) ?? 0.2)
  if (!Number.isFinite(fontSizeNum) || fontSizeNum <= 0) return []

  const scaledFontSize = fontSizeNum * FONT_SCALE
  const charAdvance = (CHAR_WIDTH + CHAR_SPACING) * scaledFontSize
  const spaceAdvance = charAdvance * 0.6
  const trailingSpacing = CHAR_SPACING * scaledFontSize
  const lineHeight = scaledFontSize * LINE_HEIGHT

  const textLines = text.split("\n")
  const totalHeight = textLines.length * lineHeight
  const lineWidths = textLines.map((line) =>
    getLineWidth(line, charAdvance, spaceAdvance, trailingSpacing),
  )

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  let y = -totalHeight / 2
  for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
    const line = textLines[lineIndex] ?? ""
    const lineWidth = lineWidths[lineIndex] ?? 0
    let x = -lineWidth / 2
    for (const char of line) {
      if (char === " ") {
        x += spaceAdvance
        continue
      }
      const glyph = GLYPH_BOUNDS[char]
      if (glyph) {
        minX = Math.min(minX, x + glyph[0] * scaledFontSize)
        minY = Math.min(minY, y + glyph[1] * scaledFontSize)
        maxX = Math.max(maxX, x + glyph[2] * scaledFontSize)
        maxY = Math.max(maxY, y + glyph[3] * scaledFontSize)
      }
      x += charAdvance
    }
    y += lineHeight
  }

  if (!Number.isFinite(minX)) return []

  const baseBounds: Bounds = { minX, minY, maxX, maxY }
  const anchorOffset = getAnchorOffsetForBounds(anchor_alignment, baseBounds)
  const anchoredBounds = translateBounds(baseBounds, anchorOffset)
  const strokeWidth = scaledFontSize * 0.15

  let localBounds: Bounds
  if (is_knockout) {
    const padLeft = knockout_padding?.left ?? scaledFontSize * 0.5
    const padRight = knockout_padding?.right ?? scaledFontSize * 0.5
    const padTop = knockout_padding?.top ?? scaledFontSize * 0.3
    const padBottom = knockout_padding?.bottom ?? scaledFontSize * 0.3
    const knockoutBounds: Bounds = {
      minX: anchoredBounds.minX - padLeft,
      minY: anchoredBounds.minY - padTop,
      maxX: anchoredBounds.maxX + padRight,
      maxY: anchoredBounds.maxY + padBottom,
    }
    const knockoutAnchorOffset = getAnchorOffsetForBounds(
      anchor_alignment,
      knockoutBounds,
    )
    localBounds = translateBounds(knockoutBounds, knockoutAnchorOffset)
  } else {
    const halfStroke = strokeWidth / 2
    localBounds = {
      minX: anchoredBounds.minX - halfStroke,
      minY: anchoredBounds.minY - halfStroke,
      maxX: anchoredBounds.maxX + halfStroke,
      maxY: anchoredBounds.maxY + halfStroke,
    }
  }

  const applyMirror = layer === "bottom" ? true : is_mirrored === true
  const mirrorSign = applyMirror ? -1 : 1
  const localCenterX = mirrorSign * ((localBounds.minX + localBounds.maxX) / 2)
  const localCenterY = -((localBounds.minY + localBounds.maxY) / 2)
  const rawWidth = localBounds.maxX - localBounds.minX
  const rawHeight = localBounds.maxY - localBounds.minY

  const rad = (ccw_rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rotatedCenter = {
    x: anchor_position.x + localCenterX * cos - localCenterY * sin,
    y: anchor_position.y + localCenterX * sin + localCenterY * cos,
  }

  const rotatedRect: RotatedRect = {
    center: rotatedCenter,
    width: rawWidth,
    height: rawHeight,
    rotation: ccw_rotation,
  }
  const axisAlignedRect = getAxisAlignedRectFromRotatedRect(rotatedRect)
  const rect = axisAlignedRect ?? rotatedRect

  return [
    {
      obstacleId: copperText.pcb_copper_text_id,
      componentId,
      type: "rect",
      layers: [layer],
      center: rect.center,
      width: rect.width,
      height: rect.height,
      ...(axisAlignedRect ? {} : { ccwRotationDegrees: ccw_rotation }),
      connectedTo: [],
    },
  ]
}
