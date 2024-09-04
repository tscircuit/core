export type PointLike =
  | { getGlobalPcbPosition: () => { x: number; y: number } }
  | { x: number; y: number }

const getDistance = (a: PointLike, b: PointLike) => {
  const aPos = "getGlobalPcbPosition" in a ? a.getGlobalPcbPosition() : a
  const bPos = "getGlobalPcbPosition" in b ? b.getGlobalPcbPosition() : b
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
