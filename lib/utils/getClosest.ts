export type PointLike =
  | { _getGlobalPcbPositionBeforeLayout: () => { x: number; y: number } }
  | { x: number; y: number }

const getDistance = (a: PointLike, b: PointLike) => {
  const aPos =
    "_getGlobalPcbPositionBeforeLayout" in a
      ? a._getGlobalPcbPositionBeforeLayout()
      : a
  const bPos =
    "_getGlobalPcbPositionBeforeLayout" in b
      ? b._getGlobalPcbPositionBeforeLayout()
      : b
  return Math.sqrt((aPos.x - bPos.x) ** 2 + (aPos.y - bPos.y) ** 2)
}

export function getClosest<T extends PointLike, U extends PointLike>(
  point: T,
  candidates: U[],
): U {
  if (candidates.length === 0)
    throw new Error("No candidates given to getClosest method")
  let closest: U = candidates[0]
  let closestDist = Infinity

  for (const candidate of candidates) {
    const dist = getDistance(point, candidate)
    if (dist < closestDist) {
      closest = candidate
      closestDist = dist
    }
  }

  return closest
}
