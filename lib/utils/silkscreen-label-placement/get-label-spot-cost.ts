import {
  type Bounds,
  type Point,
  areBoundsCompletelyInsidePolygon,
  boundsDistance,
  getBoundFromCenteredRect,
  getBoundsCenter,
  pointToBoundsDistance,
} from "@tscircuit/math-utils"
import {
  LABEL_TOUCH_DISTANCE,
  doBoundsShareArea,
  getDistanceToBoardEdge,
  getOffsetFromMiddleOfPartSide,
} from "./label-geometry"
import type { SilkscreenLabelSpatialIndex } from "./silkscreen-label-spatial-index"
import type {
  MovableSilkscreenLabel,
  SilkscreenLabelObstacle,
  SilkscreenLabelPart,
  SilkscreenLabelPlacementOptions,
} from "./types"

/**
 * Lower is better. Unreadable outweighs misread, which outweighs misoriented
 * and crowded; the other terms only rank spots without an issue.
 */
const LABEL_PLACEMENT_COSTS = {
  unreadable: 1000,
  misoriented: 150,
  crowdingMin: 100,
  crowdingMax: 250,
  crowdingCap: 1000,
  misreadBase: 300,
  misreadPerMm: 300,
  misreadMax: 1000,
  perMmFromPart: 2,
  perMmFromMiddleOfSide: 2,
  hugOwnPart: 2,
  notUpright: 10,
  coverNote: 50,
  perMmOfAmbiguity: 30,
} as const

/** A label whose center is nearer its own part by less than this (mm) is ambiguous. */
const CLEARLY_NEARER_DISTANCE = 0.5

export const getRequiredGapToObstacle = (
  obstacle: SilkscreenLabelObstacle,
  label: MovableSilkscreenLabel,
  options: SilkscreenLabelPlacementOptions,
) => {
  if (obstacle.kind === "text" || obstacle.kind === "note")
    return options.labelClearance
  // A label may touch a part's outline, just not go under it
  if (obstacle.kind === "courtyard") return 0
  return obstacle.pcbComponentId === label.pcbComponentId
    ? options.ownPartHugGap
    : options.partGap
}

export const getLargestRequiredGap = (
  options: SilkscreenLabelPlacementOptions,
) => Math.max(options.partGap, options.ownPartHugGap, options.labelClearance)

const getCrowdingCost = (gap: number, requiredGap: number) => {
  if (gap >= requiredGap - 1e-9) return 0
  const depth = requiredGap > 0 ? (requiredGap - gap) / requiredGap : 1
  return (
    LABEL_PLACEMENT_COSTS.crowdingMin +
    (LABEL_PLACEMENT_COSTS.crowdingMax - LABEL_PLACEMENT_COSTS.crowdingMin) *
      depth *
      depth
  )
}

const getFarDistance = (partBounds: Bounds) =>
  Math.max(
    1.5,
    0.25 *
      Math.max(
        partBounds.maxX - partBounds.minX,
        partBounds.maxY - partBounds.minY,
      ),
  )

/**
 * Cost of a spot for one label, ignoring the other movable labels. The same
 * rules judge the label's current spot and every candidate.
 */
export const getLabelSpotCost = ({
  labelBounds,
  isUpright,
  isReadable,
  label,
  part,
  spatialIndex,
  boardOutline,
  options,
}: {
  labelBounds: Bounds
  /** Horizontal and reading left to right. */
  isUpright: boolean
  /**
   * Reads from the bottom or the right edge of its side; upside-down text and
   * text reading from the left edge are an issue.
   */
  isReadable: boolean
  label: MovableSilkscreenLabel
  part: SilkscreenLabelPart
  spatialIndex: SilkscreenLabelSpatialIndex
  boardOutline: Point[] | null
  options: SilkscreenLabelPlacementOptions
}) => {
  const costs = LABEL_PLACEMENT_COSTS
  let isUnreadable = false
  let crowdingCost = 0
  let noteCost = 0

  for (const obstacle of spatialIndex.getObstaclesNear(
    labelBounds,
    getLargestRequiredGap(options),
  )) {
    if (obstacle.kind === "note") {
      if (
        boundsDistance(labelBounds, obstacle.bounds) <
        getRequiredGapToObstacle(obstacle, label, options) - 1e-9
      )
        noteCost += costs.coverNote
      continue
    }
    if (doBoundsShareArea(labelBounds, obstacle.bounds)) {
      isUnreadable = true
      continue
    }
    const gap = boundsDistance(labelBounds, obstacle.bounds)
    if (obstacle.kind === "text" && gap < LABEL_TOUCH_DISTANCE) {
      isUnreadable = true
      continue
    }
    crowdingCost += getCrowdingCost(
      gap,
      getRequiredGapToObstacle(obstacle, label, options),
    )
  }

  if (boardOutline) {
    if (!areBoundsCompletelyInsidePolygon(labelBounds, boardOutline))
      isUnreadable = true
    else
      crowdingCost += getCrowdingCost(
        getDistanceToBoardEdge(labelBounds, boardOutline),
        options.boardEdgeMargin,
      )
  }
  crowdingCost = Math.min(costs.crowdingCap, crowdingCost)

  const distanceToOwnPart = boundsDistance(labelBounds, part.bounds)
  // A label reads as the part nearest its center. Measuring from the center
  // also catches a long label that starts beside its part but runs past another.
  const labelCenter = getBoundsCenter(labelBounds)
  const centerDistanceToOwnPart = pointToBoundsDistance(
    labelCenter,
    part.bounds,
  )
  let centerDistanceToNearestOtherPart = Number.POSITIVE_INFINITY
  for (const otherPart of spatialIndex.getPartsNear(
    getBoundFromCenteredRect({ center: labelCenter, width: 0, height: 0 }),
    centerDistanceToOwnPart + CLEARLY_NEARER_DISTANCE,
  )) {
    if (otherPart.pcbComponentId === part.pcbComponentId) continue
    centerDistanceToNearestOtherPart = Math.min(
      centerDistanceToNearestOtherPart,
      pointToBoundsDistance(labelCenter, otherPart.bounds),
    )
  }
  const beyondFar = Math.max(0, distanceToOwnPart - getFarDistance(part.bounds))
  const nearerToAnotherPart = Math.max(
    0,
    centerDistanceToOwnPart -
      centerDistanceToNearestOtherPart -
      LABEL_TOUCH_DISTANCE,
  )
  const misreadCost =
    beyondFar > 0 || nearerToAnotherPart > 0
      ? Math.min(
          costs.misreadMax,
          costs.misreadBase +
            costs.misreadPerMm * (beyondFar + nearerToAnotherPart),
        )
      : 0
  const ambiguity = Math.min(
    CLEARLY_NEARER_DISTANCE,
    Math.max(
      0,
      CLEARLY_NEARER_DISTANCE -
        (centerDistanceToNearestOtherPart - centerDistanceToOwnPart),
    ),
  )

  const cost =
    (isUnreadable ? costs.unreadable : 0) +
    crowdingCost +
    misreadCost +
    noteCost +
    (isReadable ? 0 : costs.misoriented) +
    costs.perMmOfAmbiguity * ambiguity +
    costs.perMmFromPart * Math.max(0, distanceToOwnPart - options.ownPartGap) +
    (distanceToOwnPart < options.ownPartGap - 1e-9 ? costs.hugOwnPart : 0) +
    costs.perMmFromMiddleOfSide *
      getOffsetFromMiddleOfPartSide(part.bounds, labelBounds) +
    (isUpright ? 0 : costs.notUpright)

  return {
    cost,
    hasIssue:
      isUnreadable || crowdingCost > 0 || misreadCost > 0 || !isReadable,
    isUnreadable,
  }
}

/**
 * Returns the cost of two labels' spots: touching labels are unreadable, and
 * labels closer than `labelClearance` are crowded.
 */
export const getLabelPairCost = (
  aBounds: Bounds,
  bBounds: Bounds,
  labelClearance: number,
) => {
  if (doBoundsShareArea(aBounds, bBounds))
    return LABEL_PLACEMENT_COSTS.unreadable
  const gap = boundsDistance(aBounds, bBounds)
  if (gap < LABEL_TOUCH_DISTANCE) return LABEL_PLACEMENT_COSTS.unreadable
  return getCrowdingCost(gap, labelClearance)
}
