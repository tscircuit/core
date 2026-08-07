import type { SimpleRouteBounds, SimpleRouteJson } from "./SimpleRouteJson"

/**
 * The fanout solver reports a bare routed/total count when it cannot escape a
 * package. On a board that reads as "0/27 connections" with no indication of
 * what to change, so translate it into the two things that actually fix it:
 * widen the breakout, or pull the surrounding parts inside it.
 */

const roundMm = (value: number) => Math.round(value * 1000) / 1000

const getPadBoundsForComponents = (
  input: SimpleRouteJson,
  componentIds: ReadonlySet<string>,
): SimpleRouteBounds | undefined => {
  let bounds: SimpleRouteBounds | undefined
  for (const obstacle of input.obstacles) {
    if (!obstacle.componentId || !componentIds.has(obstacle.componentId)) {
      continue
    }
    const minX = obstacle.center.x - obstacle.width / 2
    const maxX = obstacle.center.x + obstacle.width / 2
    const minY = obstacle.center.y - obstacle.height / 2
    const maxY = obstacle.center.y + obstacle.height / 2
    bounds = bounds
      ? {
          minX: Math.min(bounds.minX, minX),
          maxX: Math.max(bounds.maxX, maxX),
          minY: Math.min(bounds.minY, minY),
          maxY: Math.max(bounds.maxY, maxY),
        }
      : { minX, maxX, minY, maxY }
  }
  return bounds
}

/**
 * Narrowest gap between the fanned-out pads and the boundary they must reach.
 * This is the space every escape has to share, so it is the number worth
 * quoting back to the user.
 */
const getNarrowestGap = (
  padBounds: SimpleRouteBounds,
  boundary: SimpleRouteBounds,
): number =>
  Math.min(
    padBounds.minX - boundary.minX,
    boundary.maxX - padBounds.maxX,
    padBounds.minY - boundary.minY,
    boundary.maxY - padBounds.maxY,
  )

export const getFanoutSpaceErrorMessage = ({
  input,
  solverError,
  componentIds,
  sharedBoundary,
  componentNamesById,
}: {
  input: SimpleRouteJson
  solverError: string | null | undefined
  componentIds: ReadonlySet<string>
  sharedBoundary: SimpleRouteBounds | undefined
  componentNamesById?: ReadonlyMap<string, string>
}): string => {
  const routedMatch = solverError?.match(/routed (\d+)\/(\d+) connections/)
  const routedCount = routedMatch ? Number(routedMatch[1]) : undefined
  const connectionCount = routedMatch
    ? Number(routedMatch[2])
    : input.connections.length

  const componentLabels = [...componentIds]
    .map((componentId) => componentNamesById?.get(componentId) ?? componentId)
    .sort()
  const componentSummary =
    componentLabels.length > 0 ? ` for ${componentLabels.join(", ")}` : ""

  const lines: string[] = [
    routedCount === undefined
      ? `Fanout failed${componentSummary}: ${solverError ?? "the fanout solver did not report a reason"}.`
      : `Fanout failed${componentSummary}: only ${routedCount} of ${connectionCount} connections could escape to the breakout boundary.`,
  ]

  const padBounds = getPadBoundsForComponents(input, componentIds)
  if (padBounds && sharedBoundary) {
    const gap = getNarrowestGap(padBounds, sharedBoundary)
    lines.push(
      `The breakout boundary is ${roundMm(gap)}mm from the pads at its narrowest point, which all ${connectionCount} escapes have to share.`,
    )
  }

  lines.push(
    "Give the fanout more room by increasing the breakout's padding, or by extending the breakout to include the parts crowding it (decoupling capacitors, series resistors) so their pads sit inside the boundary instead of against it.",
  )

  return lines.join(" ")
}
