import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type { PcbHoleCircle, PcbTrace } from "circuit-json"

/** Copper-to-drill clearance (mm) a panel trace must keep from a mouse bite. */
export const PANEL_TRACE_MOUSE_BITE_CLEARANCE = 0.2

/**
 * The closest approach of a routed trace's copper to a mouse-bite drill, when
 * it is less than PANEL_TRACE_MOUSE_BITE_CLEARANCE. Gaps are in mm and are
 * negative where the trace overlaps the drill.
 */
export function getMouseBiteClearanceViolation({
  route,
  mouseBiteHoles,
}: {
  route: PcbTrace["route"]
  mouseBiteHoles: PcbHoleCircle[]
}): { gap: number } | undefined {
  let smallestGap = Number.POSITIVE_INFINITY
  for (const [index, start] of route.entries()) {
    const end = route[index + 1]
    if (
      start.route_type !== "wire" ||
      end?.route_type !== "wire" ||
      start.layer !== end.layer
    )
      continue
    for (const hole of mouseBiteHoles) {
      const gap =
        pointToSegmentDistance(hole, start, end) -
        hole.hole_diameter / 2 -
        start.width / 2
      smallestGap = Math.min(smallestGap, gap)
    }
  }
  return smallestGap < PANEL_TRACE_MOUSE_BITE_CLEARANCE
    ? { gap: smallestGap }
    : undefined
}
