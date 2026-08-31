import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

const GEOMETRY_EPSILON = 1e-6

type WireRoutePoint = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "wire" }
>

interface BoardPoint {
  x: number
  y: number
}

export interface GetOctilinearOrbitFanoutTailParams {
  exitPoint: WireRoutePoint
  sourceComponentCenter: BoardPoint
  targetComponentCenter: BoardPoint
  /** Maximum travel along the dominant orbit axis, in millimeters. */
  outwardDistance: number
}

/**
 * Extends a fanout exit toward its remote component using only a straight leg
 * and a 45-degree leg. All inputs are points in board/circuit world space,
 * where +X is right, +Y is top, distances are millimeters, and translation
 * applies. The result excludes `exitPoint` and can be appended to its route.
 */
export const getOctilinearOrbitFanoutTail = ({
  exitPoint,
  sourceComponentCenter,
  targetComponentCenter,
  outwardDistance,
}: GetOctilinearOrbitFanoutTailParams): WireRoutePoint[] => {
  if (!Number.isFinite(outwardDistance) || outwardDistance <= 0) {
    throw new Error("outwardDistance must be finite and positive")
  }
  if (
    ![
      exitPoint.x,
      exitPoint.y,
      exitPoint.width,
      sourceComponentCenter.x,
      sourceComponentCenter.y,
      targetComponentCenter.x,
      targetComponentCenter.y,
    ].every(Number.isFinite) ||
    exitPoint.width <= 0
  ) {
    throw new Error(
      "Orbit fanout points and trace width must be finite, with positive width",
    )
  }
  const targetOffset = {
    x: targetComponentCenter.x - sourceComponentCenter.x,
    y: targetComponentCenter.y - sourceComponentCenter.y,
  }
  if (Math.hypot(targetOffset.x, targetOffset.y) <= GEOMETRY_EPSILON) {
    throw new Error("Orbit fanout source and target centers must differ")
  }

  const horizontalDominant =
    Math.abs(targetOffset.x) >= Math.abs(targetOffset.y)
  const dominantOffset = horizontalDominant ? targetOffset.x : targetOffset.y
  const secondaryOffset = horizontalDominant ? targetOffset.y : targetOffset.x
  const requestedDiagonalDistance = Math.min(
    outwardDistance,
    Math.abs((outwardDistance * secondaryOffset) / dominantOffset),
  )
  const minimumDiagonalDistance =
    exitPoint.width * Math.SQRT2 + GEOMETRY_EPSILON
  const diagonalDistance =
    requestedDiagonalDistance >= minimumDiagonalDistance
      ? requestedDiagonalDistance
      : 0
  const straightDistance = outwardDistance - diagonalDistance
  const dominantSign = Math.sign(dominantOffset)
  const secondarySign = Math.sign(secondaryOffset)

  const straightPoint: WireRoutePoint = {
    ...exitPoint,
    x: exitPoint.x + (horizontalDominant ? dominantSign * straightDistance : 0),
    y: exitPoint.y + (horizontalDominant ? 0 : dominantSign * straightDistance),
  }
  const finalPoint: WireRoutePoint = {
    ...straightPoint,
    x:
      straightPoint.x +
      (horizontalDominant
        ? dominantSign * diagonalDistance
        : secondarySign * diagonalDistance),
    y:
      straightPoint.y +
      (horizontalDominant
        ? secondarySign * diagonalDistance
        : dominantSign * diagonalDistance),
  }

  return [straightPoint, finalPoint].filter((point, pointIndex, points) => {
    const previousPoint = pointIndex === 0 ? exitPoint : points[pointIndex - 1]!
    return (
      Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) >
      GEOMETRY_EPSILON
    )
  })
}
