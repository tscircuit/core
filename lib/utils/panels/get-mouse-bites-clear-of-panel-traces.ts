import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type { PcbHoleCircle, Point } from "circuit-json"

/** Copper-to-drill clearance (mm) kept along a panel trace's path. */
const PANEL_TRACE_DRILL_CLEARANCE = 0.2
/** Half the width (mm) of a default panel trace. */
const PANEL_TRACE_HALF_WIDTH = 0.075

/**
 * Drops mouse-bite drills that would sit on a panel trace's straight path
 * between its two pads, leaving the tab undrilled where the trace crosses it.
 * Positions are circuit-world mm, +X right, +Y up.
 */
export function getMouseBitesClearOfPanelTraces({
  mouseBiteHoles,
  panelTraceSegments,
}: {
  mouseBiteHoles: PcbHoleCircle[]
  panelTraceSegments: Array<{ start: Point; end: Point }>
}): PcbHoleCircle[] {
  return mouseBiteHoles.filter((hole) =>
    panelTraceSegments.every(
      ({ start, end }) =>
        pointToSegmentDistance(hole, start, end) >=
        hole.hole_diameter / 2 +
          PANEL_TRACE_HALF_WIDTH +
          PANEL_TRACE_DRILL_CLEARANCE,
    ),
  )
}
