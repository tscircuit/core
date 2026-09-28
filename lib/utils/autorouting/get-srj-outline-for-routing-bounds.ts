import { Box } from "@flatten-js/core"
import type { SimpleRouteBounds, SimpleRouteJson } from "./SimpleRouteJson"

/**
 * Preserve the physical board edge when changing an SRJ's routing area.
 * Without an outline, SRJ bounds implicitly describe a rectangular board.
 * All vertices are points in board space (mm, +X right, +Y up).
 */
export const getSrjOutlineForRoutingBounds = (
  { bounds, outline }: Pick<SimpleRouteJson, "bounds" | "outline">,
  routingBounds: SimpleRouteBounds,
): SimpleRouteJson["outline"] => {
  if (outline) return outline
  if (
    bounds.minX === routingBounds.minX &&
    bounds.maxX === routingBounds.maxX &&
    bounds.minY === routingBounds.minY &&
    bounds.maxY === routingBounds.maxY
  ) {
    return undefined
  }
  return new Box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)
    .toPoints()
    .map(({ x, y }) => ({ x, y }))
}
