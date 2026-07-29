import type { Bounds, FanoutSolver } from "@tscircuit/fanout-solver"
import type { FanoutBoundaryPadding } from "@tscircuit/props"
import { distance } from "circuit-json"

type PreparedFanoutBus = FanoutSolver["preparedBuses"][number]
type FanoutSourcePadObstacle = PreparedFanoutBus["componentObstacles"][number]

const getDirectionalPadding = (
  padding: FanoutBoundaryPadding,
): {
  top: number
  right: number
  bottom: number
  left: number
} => {
  if (typeof padding !== "object") {
    const parsedPadding = distance.parse(padding)
    return {
      top: parsedPadding,
      right: parsedPadding,
      bottom: parsedPadding,
      left: parsedPadding,
    }
  }

  return {
    top: padding.top === undefined ? 0 : distance.parse(padding.top),
    right: padding.right === undefined ? 0 : distance.parse(padding.right),
    bottom: padding.bottom === undefined ? 0 : distance.parse(padding.bottom),
    left: padding.left === undefined ? 0 : distance.parse(padding.left),
  }
}

const getObstacleHalfExtents = (
  obstacle: FanoutSourcePadObstacle,
): { x: number; y: number } => {
  const rotationRadians = ((obstacle.ccwRotationDegrees ?? 0) * Math.PI) / 180
  const absoluteCosine = Math.abs(Math.cos(rotationRadians))
  const absoluteSine = Math.abs(Math.sin(rotationRadians))

  return {
    x: (absoluteCosine * obstacle.width + absoluteSine * obstacle.height) / 2,
    y: (absoluteSine * obstacle.width + absoluteCosine * obstacle.height) / 2,
  }
}

export const getFanoutSharedBoundary = ({
  preparedBuses,
  padding,
}: {
  preparedBuses: FanoutSolver["preparedBuses"]
  padding?: FanoutBoundaryPadding
}): Bounds | undefined => {
  if (padding === undefined) return undefined

  const sourcePadsByComponentId = new Map<string, FanoutSourcePadObstacle[]>()
  for (const bus of preparedBuses) {
    if (sourcePadsByComponentId.has(bus.componentId)) continue
    sourcePadsByComponentId.set(
      bus.componentId,
      bus.componentObstacles.filter(
        (obstacle) => obstacle.connectedTo.length > 0,
      ),
    )
  }
  const sourcePadObstacles = [...sourcePadsByComponentId.values()].flat()
  if (sourcePadObstacles.length === 0) {
    throw new Error(
      "Cannot apply fanout boundary padding without source pad obstacles",
    )
  }

  const obstacleBounds = sourcePadObstacles.map((obstacle) => {
    const halfExtents = getObstacleHalfExtents(obstacle)
    return {
      minX: obstacle.center.x - halfExtents.x,
      maxX: obstacle.center.x + halfExtents.x,
      minY: obstacle.center.y - halfExtents.y,
      maxY: obstacle.center.y + halfExtents.y,
    }
  })
  const directionalPadding = getDirectionalPadding(padding)

  return {
    minX:
      Math.min(...obstacleBounds.map((bounds) => bounds.minX)) -
      directionalPadding.left,
    maxX:
      Math.max(...obstacleBounds.map((bounds) => bounds.maxX)) +
      directionalPadding.right,
    minY:
      Math.min(...obstacleBounds.map((bounds) => bounds.minY)) -
      directionalPadding.bottom,
    maxY:
      Math.max(...obstacleBounds.map((bounds) => bounds.maxY)) +
      directionalPadding.top,
  }
}
