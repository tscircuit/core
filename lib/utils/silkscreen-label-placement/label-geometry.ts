import {
  type Bounds,
  type Point,
  boundsAreaOverlap,
  getBoundsCenter,
  getBoundsFromPoints,
  segmentToBoundsMinDistance,
} from "@tscircuit/math-utils"
import {
  type PcbTextLayout,
  getPcbTextBounds,
} from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"
import {
  applyToPoints,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { MovableSilkscreenLabel, SilkscreenLabelRotation } from "./types"

/** Labels closer than this (mm) read as one. */
export const LABEL_TOUCH_DISTANCE = 0.05

export const getLabelSize = (
  label: Pick<MovableSilkscreenLabel, "text" | "fontSize">,
  ccwRotation: SilkscreenLabelRotation,
) => {
  const { width, height } = getPcbTextBounds({
    text: label.text,
    font_size: label.fontSize,
    anchor_position: { x: 0, y: 0 },
    anchor_alignment: "center",
    ccw_rotation: ccwRotation,
  })
  return { width, height }
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

export const getBoundsUnion = (boundsList: Bounds[]): Bounds => ({
  minX: Math.min(...boundsList.map((bounds) => bounds.minX)),
  maxX: Math.max(...boundsList.map((bounds) => bounds.maxX)),
  minY: Math.min(...boundsList.map((bounds) => bounds.minY)),
  maxY: Math.max(...boundsList.map((bounds) => bounds.maxY)),
})

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
): Bounds =>
  getBoundsFromPoints(
    applyToPoints(
      compose(translate(center.x, center.y), rotateDEG(ccwRotation)),
      [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 },
      ],
    ),
  )!

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
