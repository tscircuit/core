import type { SimpleRouteJson } from "./SimpleRouteJson"

type SrjBoundsValidationInput = Pick<SimpleRouteJson, "bounds" | "connections">

const BOUNDS_TOLERANCE_MM = 1e-6

const formatMillimeters = (value: number): string =>
  `${Math.round(value * 1000) / 1000}mm`

export const assertSrjConnectionPointsWithinBounds = (
  input: SrjBoundsValidationInput,
): void => {
  const outsideConnectionPoints = input.connections.flatMap((connection) => {
    if (connection.isOffBoard) return []
    return connection.pointsToConnect.flatMap((point) => {
      const outsideBy = Math.max(
        input.bounds.minX - point.x,
        point.x - input.bounds.maxX,
        input.bounds.minY - point.y,
        point.y - input.bounds.maxY,
      )
      return outsideBy > BOUNDS_TOLERANCE_MM
        ? [{ connection, point, outsideBy }]
        : []
    })
  })

  if (outsideConnectionPoints.length === 0) return

  const affectedConnectionNames = new Set(
    outsideConnectionPoints.map(({ connection }) => connection.name),
  )
  const examples = outsideConnectionPoints
    .slice(0, 5)
    .map(({ connection, point, outsideBy }) => {
      const pointLabel =
        point.port_selector ??
        point.pcb_port_id ??
        point.pointId ??
        "unnamed point"
      return `${connection.name} (${pointLabel}) at (${formatMillimeters(point.x)}, ${formatMillimeters(point.y)}), ${formatMillimeters(outsideBy)} outside`
    })
  const omittedPointCount = outsideConnectionPoints.length - examples.length
  const omittedPointSummary =
    omittedPointCount > 0 ? `, and ${omittedPointCount} more` : ""
  const affectedConnectionLabel =
    affectedConnectionNames.size === 1 ? "connection" : "connections"

  throw new Error(
    `SimpleRouteJson bounds exclude ${outsideConnectionPoints.length} pointsToConnect across ${affectedConnectionNames.size} non-off-board ${affectedConnectionLabel}. ` +
      `Bounds are x=${formatMillimeters(input.bounds.minX)}..${formatMillimeters(input.bounds.maxX)}, y=${formatMillimeters(input.bounds.minY)}..${formatMillimeters(input.bounds.maxY)}. ` +
      `Outside points: ${examples.join("; ")}${omittedPointSummary}. ` +
      "Expand the routing bounds to contain every routable point, or set connection.isOffBoard=true when its points are intentionally external.",
  )
}
