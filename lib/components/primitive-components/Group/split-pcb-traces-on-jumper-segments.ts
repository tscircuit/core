import type { PcbTrace, PcbTraceRoutePoint } from "circuit-json"

interface JumperRoutePoint {
  route_type: "jumper"
  start: { x: number; y: number }
  end: { x: number; y: number }
}

/**
 * Split a PCB trace into segments at jumper locations.
 *
 * When autorouting with jumpers, the trace may contain "jumper" route_type
 * entries that indicate where the trace crosses over itself using a jumper
 * component. This function extracts those jumper locations and splits the
 * wire/via route into separate segments.
 *
 * @returns Array of route segments (each segment is a valid PcbTrace route)
 *          Returns null if no splitting is needed (no jumpers in the trace)
 */
export function splitPcbTracesOnJumperSegments(
  route: PcbTraceRoutePoint[],
): PcbTrace["route"][] | null {
  // Extract all jumper routes from this trace
  const jumperRoutes = route.filter(
    (p: any) => p.route_type === "jumper",
  ) as unknown as JumperRoutePoint[]

  const wireAndViaRoutes = route.filter((p: any) => p.route_type !== "jumper")

  // If no jumpers, no splitting needed
  if (jumperRoutes.length === 0) {
    return null
  }

  // Process each jumper: find where in the trace it connects and split there
  // Build a list of split points (indices where we need to cut the trace)
  const splitRanges: Array<{ startIdx: number; endIdx: number }> = []

  for (const jumperRoute of jumperRoutes) {
    const jumperStart = jumperRoute.start
    const jumperEnd = jumperRoute.end

    // Find the closest wire point to jumper start and end
    let startIdx = -1
    let endIdx = -1
    let minStartDist = Infinity
    let minEndDist = Infinity

    for (let i = 0; i < wireAndViaRoutes.length; i++) {
      const p = wireAndViaRoutes[i] as any
      if (p.route_type !== "wire") continue

      const distToStart = Math.hypot(p.x - jumperStart.x, p.y - jumperStart.y)
      const distToEnd = Math.hypot(p.x - jumperEnd.x, p.y - jumperEnd.y)

      if (distToStart < minStartDist) {
        minStartDist = distToStart
        startIdx = i
      }
      if (distToEnd < minEndDist) {
        minEndDist = distToEnd
        endIdx = i
      }
    }

    // Ensure startIdx < endIdx (the trace goes from start to end)
    if (startIdx > endIdx) {
      ;[startIdx, endIdx] = [endIdx, startIdx]
    }

    if (startIdx >= 0 && endIdx >= 0 && startIdx !== endIdx) {
      splitRanges.push({ startIdx, endIdx })
    }
  }

  // Sort split ranges by startIdx
  splitRanges.sort((a, b) => a.startIdx - b.startIdx)

  // Build segments by excluding the split ranges
  const segments: PcbTrace["route"][] = []
  let currentStart = 0

  for (const range of splitRanges) {
    // Add segment before this split range
    if (currentStart < range.startIdx) {
      segments.push(wireAndViaRoutes.slice(currentStart, range.startIdx + 1))
    }
    currentStart = range.endIdx
  }

  // Add final segment after last split
  if (currentStart < wireAndViaRoutes.length) {
    segments.push(wireAndViaRoutes.slice(currentStart))
  }

  return segments
}
