import type { Point } from "circuit-json"
import {
  applyToPoint,
  compose,
  flipY,
  identity,
  type Matrix,
} from "transformation-matrix"

/**
 * Convert a CAD position point from a component-local PCB frame to the
 * Circuit JSON board-world frame. Both frames use millimetres, +X right,
 * +Y top, and a right-handed +Z-above convention. The supplied 2D transform
 * maps component-local points into board-world points, including translation.
 * A bottom-layer placement adds Core's physical 180-degree rotation about +Y,
 * represented in PCB XY as `flipY()` (x -> -x, y -> y).
 */
export function getCadModelBoardPosition({
  componentLocalPosition,
  componentPcbLocalToBoardTransform,
  layer,
}: {
  componentLocalPosition: Point
  componentPcbLocalToBoardTransform: Matrix
  layer: "bottom" | "top"
}): Point {
  const cadModelLocalToBoardTransform = compose(
    componentPcbLocalToBoardTransform,
    layer === "bottom" ? flipY() : identity(),
  )
  return applyToPoint(cadModelLocalToBoardTransform, componentLocalPosition)
}
