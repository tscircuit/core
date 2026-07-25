type Point = { x: number; y: number }
type FacingDirection = "x+" | "x-" | "y+" | "y-"
type ObstacleRect = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  kind?: string
  chipId?: string
}

const MAX_SHORT_TRACE_DISTANCE = 0.5
const POSITION_EPSILON = 1e-6

const getOrthogonalPathLength = (points: Point[]) => {
  let length = 0
  for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
    const point = points[pointIndex]!
    const nextPoint = points[pointIndex + 1]!
    length += Math.abs(nextPoint.x - point.x) + Math.abs(nextPoint.y - point.y)
  }
  return length
}

const segmentIntersectsRect = (
  startPoint: Point,
  endPoint: Point,
  obstacle: ObstacleRect,
) => {
  const segmentIsVertical =
    Math.abs(startPoint.x - endPoint.x) <= POSITION_EPSILON
  const segmentIsHorizontal =
    Math.abs(startPoint.y - endPoint.y) <= POSITION_EPSILON
  if (!segmentIsVertical && !segmentIsHorizontal) return false

  if (segmentIsVertical) {
    if (
      startPoint.x < obstacle.minX - POSITION_EPSILON ||
      startPoint.x > obstacle.maxX + POSITION_EPSILON
    ) {
      return false
    }
    const overlap =
      Math.min(Math.max(startPoint.y, endPoint.y), obstacle.maxY) -
      Math.max(Math.min(startPoint.y, endPoint.y), obstacle.minY)
    return overlap > POSITION_EPSILON
  }

  if (
    startPoint.y < obstacle.minY - POSITION_EPSILON ||
    startPoint.y > obstacle.maxY + POSITION_EPSILON
  ) {
    return false
  }
  const overlap =
    Math.min(Math.max(startPoint.x, endPoint.x), obstacle.maxX) -
    Math.max(Math.min(startPoint.x, endPoint.x), obstacle.minX)
  return overlap > POSITION_EPSILON
}

const pathIntersectsNonEndpointObstacle = (params: {
  points: Point[]
  obstacles: ObstacleRect[]
  endpointChipIds: Set<string>
}) => {
  const { points, obstacles, endpointChipIds } = params
  return points.slice(0, -1).some((startPoint, pointIndex) => {
    const endPoint = points[pointIndex + 1]!
    return obstacles.some((obstacle) => {
      if (
        obstacle.kind === "chip" &&
        obstacle.chipId &&
        endpointChipIds.has(obstacle.chipId)
      ) {
        return false
      }
      return segmentIntersectsRect(startPoint, endPoint, obstacle)
    })
  })
}

const removeRedundantPoints = (points: Point[]) => {
  const simplifiedPoints: Point[] = []
  for (const point of points) {
    const previousPoint = simplifiedPoints[simplifiedPoints.length - 1]
    if (
      previousPoint &&
      Math.abs(previousPoint.x - point.x) <= POSITION_EPSILON &&
      Math.abs(previousPoint.y - point.y) <= POSITION_EPSILON
    ) {
      continue
    }

    simplifiedPoints.push(point)
    while (simplifiedPoints.length >= 3) {
      const firstPoint = simplifiedPoints[simplifiedPoints.length - 3]!
      const middlePoint = simplifiedPoints[simplifiedPoints.length - 2]!
      const lastPoint = simplifiedPoints[simplifiedPoints.length - 1]!
      const pointsAreHorizontal =
        Math.abs(firstPoint.y - middlePoint.y) <= POSITION_EPSILON &&
        Math.abs(middlePoint.y - lastPoint.y) <= POSITION_EPSILON
      const pointsAreVertical =
        Math.abs(firstPoint.x - middlePoint.x) <= POSITION_EPSILON &&
        Math.abs(middlePoint.x - lastPoint.x) <= POSITION_EPSILON
      if (!pointsAreHorizontal && !pointsAreVertical) break
      simplifiedPoints.splice(simplifiedPoints.length - 2, 1)
    }
  }
  return simplifiedPoints
}

/**
 * Replaces a short, backtracking route between two inward-facing pins with a
 * monotonic dogleg. The route must remain inside its endpoint bounds, so paths
 * that leave the local gap to avoid a real obstacle are preserved.
 */
export const simplifyShortBacktrackingTracePath = (params: {
  points: Point[]
  pins: Array<Point & { _facingDirection?: FacingDirection; chipId?: string }>
  getObstacles: () => ObstacleRect[] | undefined
}) => {
  const { points, pins, getObstacles } = params
  if (points.length < 4 || pins.length !== 2) return points

  const startPoint = points[0]!
  const endPoint = points[points.length - 1]!
  const xDistance = Math.abs(endPoint.x - startPoint.x)
  const yDistance = Math.abs(endPoint.y - startPoint.y)
  const minimumOrthogonalLength = xDistance + yDistance
  if (
    minimumOrthogonalLength <= POSITION_EPSILON ||
    minimumOrthogonalLength > MAX_SHORT_TRACE_DISTANCE
  ) {
    return points
  }

  const routedLength = getOrthogonalPathLength(points)
  if (routedLength <= minimumOrthogonalLength + POSITION_EPSILON) return points

  const minX = Math.min(startPoint.x, endPoint.x) - POSITION_EPSILON
  const maxX = Math.max(startPoint.x, endPoint.x) + POSITION_EPSILON
  const minY = Math.min(startPoint.y, endPoint.y) - POSITION_EPSILON
  const maxY = Math.max(startPoint.y, endPoint.y) + POSITION_EPSILON
  if (
    points.some(
      (point) =>
        point.x < minX || point.x > maxX || point.y < minY || point.y > maxY,
    )
  ) {
    return points
  }

  const [firstPin, secondPin] = pins
  const routeIsHorizontal = xDistance >= yDistance
  let candidatePoints: Point[]
  if (routeIsHorizontal) {
    const firstPinExpectedDirection = endPoint.x > startPoint.x ? "x+" : "x-"
    const secondPinExpectedDirection = endPoint.x > startPoint.x ? "x-" : "x+"
    if (
      firstPin._facingDirection !== firstPinExpectedDirection ||
      secondPin._facingDirection !== secondPinExpectedDirection
    ) {
      return points
    }

    const middleX = (startPoint.x + endPoint.x) / 2
    candidatePoints = removeRedundantPoints([
      startPoint,
      { x: middleX, y: startPoint.y },
      { x: middleX, y: endPoint.y },
      endPoint,
    ])
  } else {
    const firstPinExpectedDirection = endPoint.y > startPoint.y ? "y+" : "y-"
    const secondPinExpectedDirection = endPoint.y > startPoint.y ? "y-" : "y+"
    if (
      firstPin._facingDirection !== firstPinExpectedDirection ||
      secondPin._facingDirection !== secondPinExpectedDirection
    ) {
      return points
    }

    const middleY = (startPoint.y + endPoint.y) / 2
    candidatePoints = removeRedundantPoints([
      startPoint,
      { x: startPoint.x, y: middleY },
      { x: endPoint.x, y: middleY },
      endPoint,
    ])
  }

  const endpointChipIds = new Set(
    pins
      .map((pin) => pin.chipId)
      .filter((chipId): chipId is string => Boolean(chipId)),
  )
  const obstacles = getObstacles()
  if (!obstacles) return points
  if (
    pathIntersectsNonEndpointObstacle({
      points: candidatePoints,
      obstacles,
      endpointChipIds,
    })
  ) {
    return points
  }
  return candidatePoints
}
