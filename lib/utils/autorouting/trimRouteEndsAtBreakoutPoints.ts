import {
  distance,
  getUnitVectorFromPointAToB,
  type Point,
} from "@tscircuit/math-utils"
import type { SimplifiedPcbTrace } from "./SimpleRouteJson"

type Route = SimplifiedPcbTrace["route"]

/**
 * How far (mm) to pull descendant handoff copper back from a breakout point.
 *
 * The inner breakout autorouter routes each cross-boundary pin up to its
 * breakout point and stops, so the descendant copper ends exactly on the
 * breakout point. When that copper is fed to the parent autorouter as an
 * obstacle it buries the breakout point — which is also the parent route's
 * terminal — leaving no free routing cell there ("could not find start/end
 * region", or an unroutable cramped sliver).
 *
 * Trimming the copper back a small distance frees a routing cell at the
 * breakout point so the parent terminal resolves, while the rest of the
 * copper still blocks other nets.
 *
 * Callers should derive this distance from the board's design rules (via pad +
 * trace + clearance) so it scales with a user-specified trace width; this
 * constant is only the fallback when no value is provided. ~0.6mm is the
 * default-rule result and the smallest value that reliably frees a routable
 * cell in practice (0.3mm leaves it too cramped).
 */
export const DEFAULT_BREAKOUT_HANDOFF_TRIM_MM = 0.6

const getPointXY = (routePoint: Route[number]): Point | null => {
  const { x, y } = routePoint as { x?: number; y?: number }
  return typeof x === "number" && typeof y === "number" ? { x, y } : null
}

/**
 * Trim the route inward from whichever end(s) sit on a breakout point, by up
 * to `trimMm`. Only the obstacle geometry handed to the parent autorouter is
 * shortened — the real pcb_trace is untouched, and the parent route still
 * meets the real copper at the breakout point (same net, so any overlap in
 * the trimmed region is legal).
 */
export const trimRouteEndsAtBreakoutPoints = ({
  route,
  breakoutPointPositions,
  trimMm = DEFAULT_BREAKOUT_HANDOFF_TRIM_MM,
}: {
  route: Route
  breakoutPointPositions: Point[]
  trimMm?: number
}): Route => {
  if (breakoutPointPositions.length === 0 || route.length < 2) return route

  const isAtBreakoutPoint = (point: Point) =>
    breakoutPointPositions.some((bp) => distance(bp, point) < 0.05)

  // Consume `trimMm` of length from the front of `points`, dropping whole
  // segments and finally interpolating the last partial segment.
  const trimFront = (points: Route): Route => {
    const out = [...points]
    let remaining = trimMm
    while (out.length >= 2 && remaining > 1e-9) {
      const a = getPointXY(out[0])
      const b = getPointXY(out[1])
      if (!a || !b) break
      const segmentLength = distance(a, b)
      if (segmentLength <= remaining + 1e-9) {
        out.shift()
        remaining -= segmentLength
      } else {
        // getPointXY(out[0]) was non-null, so this point carries x/y.
        const unit = getUnitVectorFromPointAToB(a, b)
        out[0] = {
          ...out[0],
          x: a.x + unit.x * remaining,
          y: a.y + unit.y * remaining,
        } as Route[number]
        remaining = 0
      }
    }
    return out
  }

  let trimmed = route
  const first = getPointXY(trimmed[0])
  if (first && isAtBreakoutPoint(first)) trimmed = trimFront(trimmed)
  const last = getPointXY(trimmed[trimmed.length - 1])
  if (last && trimmed.length >= 2 && isAtBreakoutPoint(last)) {
    trimmed = trimFront([...trimmed].reverse()).reverse()
  }
  return trimmed
}
