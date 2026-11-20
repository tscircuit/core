import type { Point } from "@tscircuit/math-utils"
import type { TraceStep } from "./walk-trace"

/**
 * True when the negative route is stored from the other end than the
 * positive one: its ends lie closer to the positive route's ends that way.
 * Route ends are the pair's pads, so this holds even when one part owns
 * pads at both ends of the pair.
 */
export function isNegativeRouteReversed({
  positiveSteps,
  negativeSteps,
}: {
  positiveSteps: TraceStep[]
  negativeSteps: TraceStep[]
}): boolean {
  const positiveStart = positiveSteps[0].start
  const positiveEnd = positiveSteps[positiveSteps.length - 1].end
  const negativeStart = negativeSteps[0].start
  const negativeEnd = negativeSteps[negativeSteps.length - 1].end
  const sameDirection =
    distance({ a: positiveStart, b: negativeStart }) +
    distance({ a: positiveEnd, b: negativeEnd })
  const oppositeDirection =
    distance({ a: positiveStart, b: negativeEnd }) +
    distance({ a: positiveEnd, b: negativeStart })
  return oppositeDirection < sameDirection
}

/** Straight-line distance between two points, in mm. */
function distance({ a, b }: { a: Point; b: Point }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
