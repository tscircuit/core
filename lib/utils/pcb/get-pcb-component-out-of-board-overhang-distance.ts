import { point, type Polygon } from "@flatten-js/core"

/**
 * Return how far a component bounding box extends past the board outline, in
 * millimeters. The distance is the largest gap between an outside corner or
 * edge midpoint of the component and the board polygon, which matches the
 * overhang distance reported by @tscircuit/checks.
 */
export const getPcbComponentOutOfBoardOverhangDistance = ({
  componentBounds,
  boardOutlinePolygon,
}: {
  componentBounds: {
    min_x: number
    max_x: number
    min_y: number
    max_y: number
  }
  boardOutlinePolygon: Polygon
}): number => {
  const { min_x, max_x, min_y, max_y } = componentBounds
  const midX = (min_x + max_x) / 2
  const midY = (min_y + max_y) / 2
  const samplePoints = [
    point(min_x, min_y),
    point(max_x, min_y),
    point(max_x, max_y),
    point(min_x, max_y),
    point(midX, min_y),
    point(max_x, midY),
    point(midX, max_y),
    point(min_x, midY),
  ]

  let maxDistance = 0
  for (const samplePoint of samplePoints) {
    if (boardOutlinePolygon.contains(samplePoint)) continue
    const distance = boardOutlinePolygon.distanceTo(samplePoint)
    const distanceValue = Array.isArray(distance)
      ? distance[0]
      : Number(distance)
    if (distanceValue > maxDistance) maxDistance = distanceValue
  }
  return maxDistance
}
