import type { Obstacle } from "./SimpleRouteJson"

/**
 * Utility to construct border obstacles from bounds
 */
export function getObstaclesFromBounds(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  opts: { padding?: number } = {},
): Obstacle[] {
  const { minX, maxX, minY, maxY } = bounds
  const PADDING = opts.padding ?? 1
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY))
    return []
  const left = minX - PADDING
  const right = maxX + PADDING
  const top = maxY + PADDING
  const bottom = minY - PADDING
  const thickness = 0.01
  return [
    // Top border (horizontal)
    {
      type: "rect",
      layers: ["top"],
      center: { x: (left + right) / 2, y: top },
      width: right - left,
      height: thickness,
      connectedTo: [],
    },
    // Bottom border (horizontal)
    {
      type: "rect",
      layers: ["top"],
      center: { x: (left + right) / 2, y: bottom },
      width: right - left,
      height: thickness,
      connectedTo: [],
    },
    // Left border (vertical)
    {
      type: "rect",
      layers: ["top"],
      center: { x: left, y: (top + bottom) / 2 },
      width: thickness,
      height: top - bottom,
      connectedTo: [],
    },
    // Right border (vertical)
    {
      type: "rect",
      layers: ["top"],
      center: { x: right, y: (top + bottom) / 2 },
      width: thickness,
      height: top - bottom,
      connectedTo: [],
    },
  ]
}
