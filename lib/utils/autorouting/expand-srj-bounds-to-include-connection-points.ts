import type { SimpleRouteBounds, SimpleRouteJson } from "./SimpleRouteJson"

type SrjBoundsExpansionInput = Pick<SimpleRouteJson, "bounds" | "connections">

export const expandSrjBoundsToIncludeConnectionPoints = (
  input: SrjBoundsExpansionInput,
): SimpleRouteBounds => {
  const expandedBounds = { ...input.bounds }
  for (const connection of input.connections) {
    if (connection.isOffBoard) continue
    for (const point of connection.pointsToConnect) {
      expandedBounds.minX = Math.min(expandedBounds.minX, point.x)
      expandedBounds.maxX = Math.max(expandedBounds.maxX, point.x)
      expandedBounds.minY = Math.min(expandedBounds.minY, point.y)
      expandedBounds.maxY = Math.max(expandedBounds.maxY, point.y)
    }
  }
  return expandedBounds
}
