import type { Point } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"

/**
 * Resolves a unitless offset direction into board space (+X right, +Y up).
 * Endpoints are board-space points in mm. An explicit direction is
 * footprint-local, so it receives the footprint rotation/reflection but never
 * its translation. Without one, a scalar offset uses the board-space left
 * normal of from -> to.
 */
export const resolvePcbDimensionOffsetDirection = ({
  from,
  offset,
  offsetDirection,
  to,
  transform,
}: {
  from: Point
  offset?: number
  offsetDirection?: Point
  to: Point
  transform: Matrix
}): Point | undefined => {
  if (offsetDirection) {
    return applyToPoint({ ...transform, e: 0, f: 0 }, offsetDirection)
  }
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  if (offset === undefined || distance === 0) return
  return { x: -dy / distance, y: dx / distance }
}
