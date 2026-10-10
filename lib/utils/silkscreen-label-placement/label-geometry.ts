import {
  type Bounds,
  type Point,
  boundsAreaOverlap,
  getBoundFromCenteredRect,
  getBoundsCenter,
  getBoundsFromPoints,
  segmentToBoundsMinDistance,
} from "@tscircuit/math-utils"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import {
  type PcbTextLayout,
  getPcbTextBounds,
} from "lib/utils/pcb/get-pcb-text-bounds"
import {
  applyToPoints,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelLayer,
  SilkscreenLabelRotation,
} from "./types"

/** Labels closer than this (mm) read as one. */
export const LABEL_TOUCH_DISTANCE = 0.05

/** The fields that set a label's size. */
type LabelText = Pick<
  MovableSilkscreenLabel,
  "text" | "fontSize" | "isKnockout" | "knockoutPadding"
>

const getCenteredLabelBoundsAtOrigin = (
  label: LabelText,
  layer: SilkscreenLabelLayer,
  ccwRotation: SilkscreenLabelRotation,
) =>
  getPcbTextBounds({
    text: label.text,
    font_size: label.fontSize,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
    ccw_rotation: ccwRotation,
    layer,
    is_knockout: label.isKnockout,
    knockout_padding: label.knockoutPadding,
  })

export const getLabelSize = (
  label: LabelText,
  layer: SilkscreenLabelLayer,
  ccwRotation: SilkscreenLabelRotation,
) => {
  const { width, height } = getCenteredLabelBoundsAtOrigin(
    label,
    layer,
    ccwRotation,
  )
  return { width, height }
}

/** Returns the anchor that puts a center-aligned label's text on `bounds`. */
export const getLabelAnchorForBounds = (
  label: LabelText,
  layer: SilkscreenLabelLayer,
  ccwRotation: SilkscreenLabelRotation,
  bounds: Bounds,
): Point => {
  const { x, y, width, height } = getCenteredLabelBoundsAtOrigin(
    label,
    layer,
    ccwRotation,
  )
  const boundsCenter = getBoundsCenter(bounds)
  return {
    x: boundsCenter.x - (x + width / 2),
    y: boundsCenter.y - (y + height / 2),
  }
}

export const getTextBounds = (text: PcbTextLayout): Bounds => {
  const { x, y, width, height } = getPcbTextBounds(text)
  return { minX: x, minY: y, maxX: x + width, maxY: y + height }
}

/** Unlike doBoundsOverlap, boxes that only touch don't count. */
export const doBoundsShareArea = (a: Bounds, b: Bounds) =>
  boundsAreaOverlap(a, b) > 1e-12

export const expandBounds = (bounds: Bounds, margin: number): Bounds => ({
  minX: bounds.minX - margin,
  maxX: bounds.maxX + margin,
  minY: bounds.minY - margin,
  maxY: bounds.maxY + margin,
})

/** Unions any number of bounds; spreading them into Math.min could overflow the stack. */
export const getBoundsUnion = (boundsList: Bounds[]): Bounds =>
  getBoundsFromPoints(
    boundsList.flatMap((bounds) => [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
    ]),
  )!

export const getStrokeBounds = (
  start: Point,
  end: Point,
  strokeWidth: number,
): Bounds =>
  expandBounds(
    {
      minX: Math.min(start.x, end.x),
      maxX: Math.max(start.x, end.x),
      minY: Math.min(start.y, end.y),
      maxY: Math.max(start.y, end.y),
    },
    strokeWidth / 2,
  )

export const getRotatedRectBounds = (
  center: Point,
  width: number,
  height: number,
  ccwRotation: number,
): Bounds => {
  const axisAlignedSize = getAxisAlignedSizeFromRotatedRect({
    width,
    height,
    ccwRotationDegrees: ccwRotation,
  })
  return getBoundFromCenteredRect({
    center,
    width: axisAlignedSize.width,
    height: axisAlignedSize.height,
  })
}

const ELLIPSE_OUTLINE_SEGMENTS = 16

/**
 * Approximates an ellipse outline with the bounds of short strokes along it, so
 * a label may sit inside the ellipse. Strokes are widened to cover the arc
 * between their ends.
 */
export const getEllipseOutlineBoundsList = ({
  center,
  radiusX,
  radiusY,
  ccwRotation,
  strokeWidth,
}: {
  center: Point
  radiusX: number
  radiusY: number
  ccwRotation: number
  strokeWidth: number
}): Bounds[] => {
  const points = applyToPoints(
    compose(translate(center.x, center.y), rotateDEG(ccwRotation)),
    Array.from({ length: ELLIPSE_OUTLINE_SEGMENTS }, (_, i) => {
      const angle = (2 * Math.PI * i) / ELLIPSE_OUTLINE_SEGMENTS
      return { x: radiusX * Math.cos(angle), y: radiusY * Math.sin(angle) }
    }),
  )
  const arcHeight =
    Math.max(radiusX, radiusY) *
    (1 - Math.cos(Math.PI / ELLIPSE_OUTLINE_SEGMENTS))
  return points.map((point, i) =>
    getStrokeBounds(
      point,
      points[(i + 1) % points.length]!,
      strokeWidth + 2 * arcHeight,
    ),
  )
}

export const getDistanceToBoardEdge = (
  bounds: Bounds,
  boardOutline: Point[],
) => {
  let distance = Number.POSITIVE_INFINITY
  boardOutline.forEach((start, i) => {
    const end = boardOutline[(i + 1) % boardOutline.length]!
    distance = Math.min(
      distance,
      segmentToBoundsMinDistance(start, end, bounds),
    )
  })
  return distance
}

/**
 * Distance (mm) from a label's center to the middle of the part side it faces.
 * It faces the top or bottom side when the vertical gap between the boxes is
 * at least the horizontal gap.
 */
export const getOffsetFromMiddleOfPartSide = (
  partBounds: Bounds,
  labelBounds: Bounds,
) => {
  const horizontalGap = Math.max(
    0,
    partBounds.minX - labelBounds.maxX,
    labelBounds.minX - partBounds.maxX,
  )
  const verticalGap = Math.max(
    0,
    partBounds.minY - labelBounds.maxY,
    labelBounds.minY - partBounds.maxY,
  )
  const partCenter = getBoundsCenter(partBounds)
  const labelCenter = getBoundsCenter(labelBounds)
  return verticalGap >= horizontalGap
    ? Math.abs(labelCenter.x - partCenter.x)
    : Math.abs(labelCenter.y - partCenter.y)
}
