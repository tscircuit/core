import type { SimpleRoutePoint } from "./SimpleRouteJson"

const SRJ_POINT_POSITION_TOLERANCE_MM = 1e-6

/**
 * Returns whether two SRJ points carry the same stable endpoint identity.
 *
 * Inputs are physical points in the board-world frame (+X right, +Y top),
 * with coordinates in millimeters. Position and layer are intentionally ignored.
 */
export const srjPointsHaveSamePointId = (
  first: SimpleRoutePoint,
  second: SimpleRoutePoint,
): boolean =>
  first.pointId !== undefined &&
  second.pointId !== undefined &&
  first.pointId === second.pointId

/**
 * Returns whether two SRJ points occupy the same board position and PCB layer.
 *
 * Inputs are physical points in the board-world frame (+X right, +Y top),
 * with coordinates in millimeters. They are positions, not direction vectors.
 */
export const srjPointsHaveSameBoardPositionAndLayer = (
  first: SimpleRoutePoint,
  second: SimpleRoutePoint,
): boolean =>
  Math.abs(first.x - second.x) <= SRJ_POINT_POSITION_TOLERANCE_MM &&
  Math.abs(first.y - second.y) <= SRJ_POINT_POSITION_TOLERANCE_MM &&
  first.layer === second.layer

/**
 * Returns whether two SRJ points refer to the same physical endpoint.
 *
 * Inputs are physical points in the board-world frame (+X right, +Y top),
 * with coordinates in millimeters. When both points have a `pointId`, stable
 * identity is authoritative; otherwise position and PCB layer must match.
 */
export const srjPointsReferToSameEndpoint = (
  first: SimpleRoutePoint,
  second: SimpleRoutePoint,
): boolean =>
  first.pointId !== undefined && second.pointId !== undefined
    ? srjPointsHaveSamePointId(first, second)
    : srjPointsHaveSameBoardPositionAndLayer(first, second)
