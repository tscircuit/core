import type { Point } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export type NoteDimensionMeasurementMode = "center" | "inner" | "outer"

export type ResolvedNoteDimensionTarget = {
  point: Point
  bounds?: { left: number; right: number; top: number; bottom: number }
  component?: PrimitiveComponent
}

export type AdjustedDimensionPoints = {
  from: Point
  to: Point
  usedMode: NoteDimensionMeasurementMode
  missingBoundsFor: ("from" | "to")[]
}

export function resolveNoteDimensionTarget({
  dimension,
  input,
  resolveComponent,
}: {
  dimension: PrimitiveComponent
  input: string | Point
  resolveComponent: (input: string) => PrimitiveComponent | null
}): ResolvedNoteDimensionTarget {
  if (typeof input === "string") {
    const target = resolveComponent(input)

    if (!target) {
      dimension.renderError(
        `${dimension.componentName} could not find selector "${input}"`,
      )
      const fallbackPoint = dimension._getGlobalPcbPositionBeforeLayout()
      return { point: fallbackPoint }
    }

    const bounds = target._getPcbCircuitJsonBounds?.()
    const hasBounds =
      !!bounds &&
      Number.isFinite(bounds.width) &&
      Number.isFinite(bounds.height) &&
      (Math.abs(bounds.width) > 0 || Math.abs(bounds.height) > 0)

    if (hasBounds) {
      return {
        point: bounds.center,
        bounds: bounds.bounds,
        component: target,
      }
    }

    const point = target._getGlobalPcbPositionBeforeLayout()
    return { point, component: target }
  }

  const numericX =
    typeof input.x === "string" ? parseFloat(input.x) : (input.x ?? 0)
  const numericY =
    typeof input.y === "string" ? parseFloat(input.y) : (input.y ?? 0)

  return {
    point: { x: numericX, y: numericY },
  }
}

export function adjustDimensionPoints({
  from,
  to,
  mode,
}: {
  from: ResolvedNoteDimensionTarget
  to: ResolvedNoteDimensionTarget
  mode: NoteDimensionMeasurementMode
}): AdjustedDimensionPoints {
  const missingBoundsFor: ("from" | "to")[] = []

  if (!from.bounds) missingBoundsFor.push("from")
  if (!to.bounds) missingBoundsFor.push("to")

  if (mode === "center" || missingBoundsFor.length > 0) {
    return {
      from: from.point,
      to: to.point,
      usedMode: missingBoundsFor.length > 0 ? "center" : mode,
      missingBoundsFor,
    }
  }

  const dx = to.point.x - from.point.x
  const dy = to.point.y - from.point.y
  const horizontal = Math.abs(dx) >= Math.abs(dy)

  if (horizontal) {
    const direction = dx >= 0 ? 1 : -1
    if (mode === "inner") {
      const fromX = direction >= 0 ? from.bounds!.right : from.bounds!.left
      const toX = direction >= 0 ? to.bounds!.left : to.bounds!.right
      return {
        from: { x: fromX, y: from.point.y },
        to: { x: toX, y: to.point.y },
        usedMode: "inner",
        missingBoundsFor,
      }
    }

    const fromX = direction >= 0 ? from.bounds!.left : from.bounds!.right
    const toX = direction >= 0 ? to.bounds!.right : to.bounds!.left
    return {
      from: { x: fromX, y: from.point.y },
      to: { x: toX, y: to.point.y },
      usedMode: "outer",
      missingBoundsFor,
    }
  }

  const direction = dy >= 0 ? 1 : -1

  if (mode === "inner") {
    const fromY = direction >= 0 ? from.bounds!.bottom : from.bounds!.top
    const toY = direction >= 0 ? to.bounds!.top : to.bounds!.bottom
    return {
      from: { x: from.point.x, y: fromY },
      to: { x: to.point.x, y: toY },
      usedMode: "inner",
      missingBoundsFor,
    }
  }

  const fromY = direction >= 0 ? from.bounds!.top : from.bounds!.bottom
  const toY = direction >= 0 ? to.bounds!.bottom : to.bounds!.top
  return {
    from: { x: from.point.x, y: fromY },
    to: { x: to.point.x, y: toY },
    usedMode: "outer",
    missingBoundsFor,
  }
}

export function formatDimensionDistance({
  from,
  to,
  units,
}: {
  from: Point
  to: Point
  units: "mm" | "in"
}): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distanceInMillimeters = Math.sqrt(dx * dx + dy * dy)
  const distanceInUnits =
    units === "in" ? distanceInMillimeters / 25.4 : distanceInMillimeters

  const roundedDistance = Math.round(distanceInUnits)
  const isWholeNumber = Math.abs(distanceInUnits - roundedDistance) < 1e-9

  if (isWholeNumber) {
    return `${roundedDistance}${units}`
  }

  const decimalPlaces = units === "in" ? 3 : 2
  const valueText =
    units === "in"
      ? Number(distanceInUnits.toFixed(decimalPlaces)).toString()
      : distanceInUnits.toFixed(decimalPlaces)

  return `${valueText}${units}`
}
