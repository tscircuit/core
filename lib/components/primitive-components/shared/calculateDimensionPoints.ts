import type { Point } from "circuit-json"

export type DimensionTarget = {
  center: Point
  width: number
  height: number
}

export type DimensionMode =
  | "center_to_center"
  | "inner_edge_to_edge"
  | "outer_edge_to_edge"

const ZERO_POINT: Point = { x: 0, y: 0 }

const DEFAULT_DIRECTION: Point = { x: 1, y: 0 }

const getUnitVector = (from: Point, to: Point): Point => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (length === 0) {
    return DEFAULT_DIRECTION
  }

  return { x: dx / length, y: dy / length }
}

const projectHalfSizeOntoDirection = (target: DimensionTarget, unit: Point) => {
  const halfWidth = target.width / 2
  const halfHeight = target.height / 2

  if (halfWidth === 0 && halfHeight === 0) return 0

  return halfWidth * Math.abs(unit.x) + halfHeight * Math.abs(unit.y)
}

const add = (point: Point, delta: Point): Point => ({
  x: point.x + delta.x,
  y: point.y + delta.y,
})

const scale = (point: Point, amount: number): Point => ({
  x: point.x * amount,
  y: point.y * amount,
})

export const calculateDimensionPoints = ({
  fromTarget,
  toTarget,
  mode,
}: {
  fromTarget: DimensionTarget
  toTarget: DimensionTarget
  mode: DimensionMode
}): { fromPoint: Point; toPoint: Point } => {
  const unit = getUnitVector(fromTarget.center, toTarget.center)

  const fromHalfDistance = projectHalfSizeOntoDirection(fromTarget, unit)
  const toHalfDistance = projectHalfSizeOntoDirection(toTarget, unit)

  if (mode === "center_to_center") {
    return {
      fromPoint: fromTarget.center,
      toPoint: toTarget.center,
    }
  }

  if (mode === "inner_edge_to_edge") {
    const fromPoint = add(fromTarget.center, scale(unit, fromHalfDistance))
    const toPoint = add(toTarget.center, scale(unit, -toHalfDistance))
    return { fromPoint, toPoint }
  }

  if (mode === "outer_edge_to_edge") {
    const fromPoint = add(fromTarget.center, scale(unit, -fromHalfDistance))
    const toPoint = add(toTarget.center, scale(unit, toHalfDistance))
    return { fromPoint, toPoint }
  }

  return {
    fromPoint: ZERO_POINT,
    toPoint: ZERO_POINT,
  }
}

export const getDimensionModeFromProps = ({
  centerToCenter,
  innerEdgeToEdge,
  outerEdgeToEdge,
}: {
  centerToCenter?: boolean
  innerEdgeToEdge?: boolean
  outerEdgeToEdge?: boolean
}): DimensionMode => {
  if (innerEdgeToEdge) return "inner_edge_to_edge"
  if (outerEdgeToEdge) return "outer_edge_to_edge"
  return "center_to_center"
}
