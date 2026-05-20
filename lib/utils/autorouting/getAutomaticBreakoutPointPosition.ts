import type { Obstacle } from "lib/utils/obstacles/types"

export type AutomaticBreakoutPoint = { x: number; y: number }

export type AutomaticBreakoutBoundary = {
  left: number
  right: number
  bottom: number
  top: number
}

export type AutomaticBreakoutPointClearanceConstraint = {
  position: AutomaticBreakoutPoint
  clearance: number
}

type BoundaryEdge = "left" | "right" | "bottom" | "top"

const getDistance = (a: AutomaticBreakoutPoint, b: AutomaticBreakoutPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y)

const pointIsInsideObstacle = ({
  point,
  obstacle,
  margin,
}: {
  point: AutomaticBreakoutPoint
  obstacle: Obstacle
  margin: number
}) => {
  const rotationRadians = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const cos = Math.cos(-rotationRadians)
  const sin = Math.sin(-rotationRadians)
  const dx = point.x - obstacle.center.x
  const dy = point.y - obstacle.center.y
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  return (
    Math.abs(localX) <= obstacle.width / 2 + margin &&
    Math.abs(localY) <= obstacle.height / 2 + margin
  )
}

const getRayBoundaryIntersection = ({
  from,
  to,
  boundary,
}: {
  from: AutomaticBreakoutPoint
  to: AutomaticBreakoutPoint
  boundary: AutomaticBreakoutBoundary
}): AutomaticBreakoutPoint | null => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return null

  const candidates: Array<{ t: number; point: AutomaticBreakoutPoint }> = []

  if (dx !== 0) {
    for (const x of [boundary.left, boundary.right]) {
      const t = (x - from.x) / dx
      const y = from.y + t * dy
      if (t > 0 && y >= boundary.bottom && y <= boundary.top) {
        candidates.push({ t, point: { x, y } })
      }
    }
  }

  if (dy !== 0) {
    for (const y of [boundary.bottom, boundary.top]) {
      const t = (y - from.y) / dy
      const x = from.x + t * dx
      if (t > 0 && x >= boundary.left && x <= boundary.right) {
        candidates.push({ t, point: { x, y } })
      }
    }
  }

  candidates.sort((a, b) => a.t - b.t)
  return candidates[0]?.point ?? null
}

const getBoundaryEdge = (
  point: AutomaticBreakoutPoint,
  boundary: AutomaticBreakoutBoundary,
): BoundaryEdge => {
  if (Math.abs(point.x - boundary.left) < 1e-6) return "left"
  if (Math.abs(point.x - boundary.right) < 1e-6) return "right"
  if (Math.abs(point.y - boundary.bottom) < 1e-6) return "bottom"
  return "top"
}

const getBoundaryEdgeCandidates = ({
  edge,
  boundary,
  step,
}: {
  edge: BoundaryEdge
  boundary: AutomaticBreakoutBoundary
  step: number
}) => {
  const candidates: AutomaticBreakoutPoint[] = []

  if (edge === "left" || edge === "right") {
    const x = edge === "left" ? boundary.left : boundary.right
    for (let y = boundary.bottom; y <= boundary.top + step / 2; y += step) {
      candidates.push({ x, y: Math.min(y, boundary.top) })
    }
  } else {
    const y = edge === "bottom" ? boundary.bottom : boundary.top
    for (let x = boundary.left; x <= boundary.right + step / 2; x += step) {
      candidates.push({ x: Math.min(x, boundary.right), y })
    }
  }

  return candidates
}

const getBoundaryPerimeterCandidates = ({
  boundary,
  step,
}: {
  boundary: AutomaticBreakoutBoundary
  step: number
}) => {
  const candidates: AutomaticBreakoutPoint[] = []
  const addCandidate = (candidate: AutomaticBreakoutPoint) => {
    if (
      candidates.some(
        (existingCandidate) =>
          Math.abs(existingCandidate.x - candidate.x) < 1e-6 &&
          Math.abs(existingCandidate.y - candidate.y) < 1e-6,
      )
    ) {
      return
    }
    candidates.push(candidate)
  }

  for (const edge of ["left", "right", "bottom", "top"] as const) {
    for (const candidate of getBoundaryEdgeCandidates({
      edge,
      boundary,
      step,
    })) {
      addCandidate(candidate)
    }
  }

  return candidates
}

export const getAutomaticBreakoutPointPosition = ({
  insidePortPosition,
  outsideTargetPosition,
  boundary,
  usedBoundaryPoints,
  pointClearanceConstraints,
  outsidePortObstacles,
  outsideCopperClearance,
  boundaryPointSpacing,
}: {
  insidePortPosition: AutomaticBreakoutPoint
  outsideTargetPosition: AutomaticBreakoutPoint
  boundary: AutomaticBreakoutBoundary
  usedBoundaryPoints: AutomaticBreakoutPoint[]
  pointClearanceConstraints: AutomaticBreakoutPointClearanceConstraint[]
  outsidePortObstacles: Obstacle[]
  outsideCopperClearance: number
  boundaryPointSpacing: number
}): AutomaticBreakoutPoint | null => {
  const rayIntersection = getRayBoundaryIntersection({
    from: insidePortPosition,
    to: outsideTargetPosition,
    boundary,
  })
  if (!rayIntersection) return null
  if (boundaryPointSpacing <= 0) return rayIntersection

  const hasConflict = (candidate: AutomaticBreakoutPoint) =>
    usedBoundaryPoints.some(
      (usedPoint) => getDistance(usedPoint, candidate) < boundaryPointSpacing,
    ) ||
    pointClearanceConstraints.some(
      (constraint) =>
        getDistance(constraint.position, candidate) < constraint.clearance,
    ) ||
    outsidePortObstacles.some((obstacle) =>
      pointIsInsideObstacle({
        point: candidate,
        obstacle,
        margin: outsideCopperClearance,
      }),
    )

  if (!hasConflict(rayIntersection)) return rayIntersection

  const edge = getBoundaryEdge(rayIntersection, boundary)
  const edgeCandidates = getBoundaryEdgeCandidates({
    edge,
    boundary,
    step: boundaryPointSpacing,
  })
  edgeCandidates.sort(
    (a, b) => getDistance(a, rayIntersection) - getDistance(b, rayIntersection),
  )

  const edgeCandidate = edgeCandidates.find(
    (candidate) => !hasConflict(candidate),
  )
  if (edgeCandidate) return edgeCandidate

  const perimeterCandidates = getBoundaryPerimeterCandidates({
    boundary,
    step: boundaryPointSpacing,
  })
  perimeterCandidates.sort(
    (a, b) => getDistance(a, rayIntersection) - getDistance(b, rayIntersection),
  )

  return (
    perimeterCandidates.find((candidate) => !hasConflict(candidate)) ?? null
  )
}
