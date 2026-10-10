import {
  type Bounds,
  type Point,
  areBoundsCompletelyInsidePolygon,
  boundsDistance,
  getBoundFromCenteredRect,
  normalizeDegrees,
} from "@tscircuit/math-utils"
import {
  getLabelSpotCost,
  getLargestRequiredGap,
  getRequiredGapToObstacle,
} from "./get-label-spot-cost"
import {
  doBoundsShareArea,
  getDistanceToBoardEdge,
  getLabelSize,
} from "./label-geometry"
import type { SilkscreenLabelSpatialIndex } from "./silkscreen-label-spatial-index"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelLayer,
  SilkscreenLabelPart,
  SilkscreenLabelPlacementOptions,
  SilkscreenLabelRotation,
} from "./types"

export interface SilkscreenLabelCandidate {
  bounds: Bounds
  /** null for the label's current spot, where its text is left untouched. */
  ccwRotation: SilkscreenLabelRotation | null
  /** Ignores the other movable labels. The current spot costs nothing unless it has an issue. */
  ownCost: number
  hasIssue: boolean
}

const PART_SIDES = ["top", "bottom", "right", "left"] as const
type PartSide = (typeof PART_SIDES)[number]

const OUTWARD_NORMAL_BY_PART_SIDE: Record<PartSide, Point> = {
  top: { x: 0, y: 1 },
  bottom: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
}

const MAX_PUSHES = 64

// Bottom text is mirrored, so it reads from the right edge seen from below at 270
const VERTICAL_CCW_ROTATION_BY_LAYER: Record<
  SilkscreenLabelLayer,
  SilkscreenLabelRotation
> = { top: 90, bottom: 270 }

/** Returns the middle of the side, then positions every `step` mm along it, past both ends. */
const getPositionsAlongPartSide = (
  partBounds: Bounds,
  side: PartSide,
  labelSize: { width: number; height: number },
  step: number,
) => {
  const isHorizontalSide = side === "top" || side === "bottom"
  const start = isHorizontalSide
    ? partBounds.minX - labelSize.width / 2
    : partBounds.minY - labelSize.height / 2
  const end = isHorizontalSide
    ? partBounds.maxX + labelSize.width / 2
    : partBounds.maxY + labelSize.height / 2
  const middle = isHorizontalSide
    ? (partBounds.minX + partBounds.maxX) / 2
    : (partBounds.minY + partBounds.maxY) / 2
  const positions = [middle]
  const count = Math.max(1, Math.round((end - start) / step))
  for (let i = 0; i <= count; i++)
    positions.push(start + ((end - start) * i) / count)
  return positions
}

const getCenterBesidePartSide = (
  partBounds: Bounds,
  side: PartSide,
  positionAlongSide: number,
  labelSize: { width: number; height: number },
  gap: number,
): Point => {
  switch (side) {
    case "top":
      return {
        x: positionAlongSide,
        y: partBounds.maxY + gap + labelSize.height / 2,
      }
    case "bottom":
      return {
        x: positionAlongSide,
        y: partBounds.minY - gap - labelSize.height / 2,
      }
    case "right":
      return {
        x: partBounds.maxX + gap + labelSize.width / 2,
        y: positionAlongSide,
      }
    case "left":
      return {
        x: partBounds.minX - gap - labelSize.width / 2,
        y: positionAlongSide,
      }
  }
}

const getPushToClear = (
  labelBounds: Bounds,
  obstacleBounds: Bounds,
  side: PartSide,
  gap: number,
) => {
  switch (side) {
    case "top":
      return obstacleBounds.maxY + gap - labelBounds.minY
    case "bottom":
      return labelBounds.maxY - (obstacleBounds.minY - gap)
    case "right":
      return obstacleBounds.maxX + gap - labelBounds.minX
    case "left":
      return labelBounds.maxX - (obstacleBounds.minX - gap)
  }
}

/**
 * Pushes a label away from its part until it keeps its gap from every
 * obstacle, and returns every center it passes. The last one is still blocked
 * when the push would exceed `maxPushOut` or reach the board edge.
 */
const getCentersPushedClearOfObstacles = ({
  center,
  side,
  labelSize,
  label,
  spatialIndex,
  boardOutline,
  options,
}: {
  center: Point
  side: PartSide
  labelSize: { width: number; height: number }
  label: MovableSilkscreenLabel
  spatialIndex: SilkscreenLabelSpatialIndex
  boardOutline: Point[] | null
  options: SilkscreenLabelPlacementOptions
}) => {
  const normal = OUTWARD_NORMAL_BY_PART_SIDE[side]
  const centers = [center]
  let pushedOut = 0
  for (let pushCount = 0; pushCount < MAX_PUSHES; pushCount++) {
    const pushedCenter = centers.at(-1)!
    const bounds = getBoundFromCenteredRect({
      center: pushedCenter,
      ...labelSize,
    })
    if (
      boardOutline &&
      (!areBoundsCompletelyInsidePolygon(bounds, boardOutline) ||
        getDistanceToBoardEdge(bounds, boardOutline) <
          options.boardEdgeMargin - 1e-9)
    )
      break
    let push = 0
    for (const obstacle of spatialIndex.getObstaclesNear(
      bounds,
      getLargestRequiredGap(options),
    )) {
      // Notes only rank spots; they never push a label
      if (obstacle.kind === "note") continue
      const gap = getRequiredGapToObstacle(obstacle, label, options)
      if (
        !doBoundsShareArea(bounds, obstacle.bounds) &&
        boundsDistance(bounds, obstacle.bounds) >= gap - 1e-9
      )
        continue
      push = Math.max(push, getPushToClear(bounds, obstacle.bounds, side, gap))
    }
    pushedOut += push
    if (push <= 1e-9 || pushedOut > options.maxPushOut + 1e-9) break
    centers.push({
      x: pushedCenter.x + normal.x * push,
      y: pushedCenter.y + normal.y * push,
    })
  }
  return centers
}

export interface SilkscreenLabelCandidateContext {
  label: MovableSilkscreenLabel
  layer: SilkscreenLabelLayer
  part: SilkscreenLabelPart
  spatialIndex: SilkscreenLabelSpatialIndex
  boardOutline: Point[] | null
  options: SilkscreenLabelPlacementOptions
}

const isSameRotation = (a: number, b: number) => {
  const difference = normalizeDegrees(a - b)
  return Math.min(difference, 360 - difference) < 1e-6
}

const isUpright = (ccwRotation: number) => isSameRotation(ccwRotation, 0)

/** Horizontal, or vertical reading from the right edge of its side. */
const isReadable = (ccwRotation: number, layer: SilkscreenLabelLayer) =>
  isUpright(ccwRotation) ||
  isSameRotation(ccwRotation, VERTICAL_CCW_ROTATION_BY_LAYER[layer])

/** Returns the label's current spot, which costs nothing unless it has an issue. */
export const getCurrentSpotCandidate = ({
  label,
  layer,
  part,
  spatialIndex,
  boardOutline,
  options,
}: SilkscreenLabelCandidateContext): SilkscreenLabelCandidate => {
  const currentSpotCost = getLabelSpotCost({
    labelBounds: label.currentBounds,
    isUpright: isUpright(label.currentCcwRotation),
    isReadable: isReadable(label.currentCcwRotation, layer),
    label,
    part,
    spatialIndex,
    boardOutline,
    options,
  })
  return {
    bounds: label.currentBounds,
    ccwRotation: null,
    ownCost: currentSpotCost.hasIssue ? currentSpotCost.cost : 0,
    hasIssue: currentSpotCost.hasIssue,
  }
}

/**
 * Generates spots around every side of the label's part, horizontal and
 * vertical, at the preferred and the hugging gap. A spot that can't be cleared still offers the
 * readable spots on its way out, so a boxed-in label takes the least bad one.
 */
export const generateMovedSilkscreenLabelCandidates = ({
  label,
  layer,
  part,
  spatialIndex,
  boardOutline,
  options,
}: SilkscreenLabelCandidateContext) => {
  const candidates: SilkscreenLabelCandidate[] = []
  const seenCandidateKeys = new Set<string>()
  const ownPartGaps = [...new Set([options.ownPartGap, options.ownPartHugGap])]
  const ccwRotations: SilkscreenLabelRotation[] = [
    0,
    VERTICAL_CCW_ROTATION_BY_LAYER[layer],
  ]
  for (const ccwRotation of ccwRotations) {
    const labelSize = getLabelSize(label, layer, ccwRotation)
    for (const ownPartGap of ownPartGaps) {
      for (const side of PART_SIDES) {
        for (const positionAlongSide of getPositionsAlongPartSide(
          part.bounds,
          side,
          labelSize,
          options.candidateStep,
        )) {
          for (const center of getCentersPushedClearOfObstacles({
            center: getCenterBesidePartSide(
              part.bounds,
              side,
              positionAlongSide,
              labelSize,
              ownPartGap,
            ),
            side,
            labelSize,
            label,
            spatialIndex,
            boardOutline,
            options,
          })) {
            const candidateKey = `${ccwRotation}:${center.x.toFixed(4)}:${center.y.toFixed(4)}`
            if (seenCandidateKeys.has(candidateKey)) continue
            seenCandidateKeys.add(candidateKey)

            const bounds = getBoundFromCenteredRect({ center, ...labelSize })
            const spotCost = getLabelSpotCost({
              labelBounds: bounds,
              isUpright: ccwRotation === 0,
              isReadable: true,
              label,
              part,
              spatialIndex,
              boardOutline,
              options,
            })
            // Moving only helps when the label can be read where it lands
            if (spotCost.isUnreadable) continue
            candidates.push({
              bounds,
              ccwRotation,
              ownCost: spotCost.cost + options.costToMove,
              hasIssue: spotCost.hasIssue,
            })
          }
        }
      }
    }
  }
  return candidates
}
