import type { PcbTrace } from "circuit-json"

type Point = { x: number; y: number }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const angleDifference = (a: number, b: number) =>
  Math.abs(((((a - b + 180) % 360) + 360) % 360) - 180)

/** Measurements use board-world millimeters. Count ordinary octilinear turns,
 * excluding curve tessellation, using the published board audit's 0.2° tolerance. */
export function measureRoutingQuality(traces: PcbTrace[]) {
  return traces.map((trace) => {
    let planarLength = 0
    let ordinaryTurns = 0
    let shortJogs = 0
    const runs: Point[][] = []
    for (let i = 0; i < trace.route.length; i++) {
      const p = trace.route[i]
      const previous = trace.route[i - 1]
      if (p.route_type !== "wire") continue
      if (previous?.route_type === "wire" && previous.layer === p.layer) {
        planarLength += distance(previous, p)
        if (distance(runs.at(-1)!.at(-1)!, p) > 1e-8) runs.at(-1)!.push(p)
      } else runs.push([p])
    }
    for (const points of runs) {
      const headings = points
        .slice(1)
        .map(
          (p, i) =>
            (Math.atan2(p.y - points[i].y, p.x - points[i].x) * 180) / Math.PI,
        )
      const aligned = headings.map(
        (h) => angleDifference(h, Math.round(h / 45) * 45) < 0.2,
      )
      const turns = new Set<number>()
      for (let i = 1; i < headings.length; i++)
        if (
          aligned[i - 1] &&
          aligned[i] &&
          angleDifference(headings[i - 1], headings[i]) > 0.2
        )
          turns.add(i)
      ordinaryTurns += turns.size
      for (let i = 1; i < points.length; i++)
        if (
          turns.has(i - 1) &&
          turns.has(i) &&
          distance(points[i - 1], points[i]) < 0.25
        )
          shortJogs++
    }
    const start = trace.route[0],
      end = trace.route.at(-1)!
    if (start.route_type !== "wire" || end.route_type !== "wire")
      throw Error("Expected pad-to-pad traces with wire endpoints")
    return {
      sourceTraceId: trace.source_trace_id,
      planarLength,
      detourRatio: planarLength / distance(start, end),
      ordinaryTurns,
      shortJogs,
    }
  })
}

const pointSegmentDistance = (p: Point, a: Point, b: Point) => {
  const squared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  const t = squared
    ? Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / squared,
        ),
      )
    : 0
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
}

/** Reference-specific audit: each end may use 6.2 mm to approach the shared
 * corridor. This is a fixture acceptance limit, not an implicit solver default.
 * Continuous DRC separately verifies clearance; sampling verifies coupling. */
export function measurePairInteriorGaps(first: PcbTrace, second: PcbTrace) {
  const carrier = (trace: PcbTrace) => {
    const vias = trace.route.flatMap((p, i) =>
      p.route_type === "via" ? [i] : [],
    )
    if (vias.length !== 2) throw Error("Expected exactly two local dogbones")
    const points = trace.route.slice(vias[0] + 1, vias[1])
    if (!points.every((p) => p.route_type === "wire"))
      throw Error("Carrier contains vias")
    if (new Set(points.map((p) => p.layer)).size !== 1)
      throw Error("Carrier changes layers")
    return points
  }
  const paths = [carrier(first), carrier(second)]
  if (paths[0][0].layer !== paths[1][0].layer) throw Error("Pair layers differ")
  const gaps: number[] = []
  for (let side = 0; side < 2; side++) {
    const path = paths[side],
      mate = paths[1 - side]
    const total = path.slice(1).reduce((n, p, i) => n + distance(path[i], p), 0)
    let traveled = 0
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i],
        span = distance(a, b)
      const steps = Math.max(1, Math.ceil(span / 0.01))
      for (let j = 0; j < steps; j++) {
        const at = traveled + (span * j) / steps
        if (at < 6.2 || at > total - 6.2) continue
        const p = {
          x: a.x + ((b.x - a.x) * j) / steps,
          y: a.y + ((b.y - a.y) * j) / steps,
        }
        const nearest = Math.min(
          ...mate.slice(1).map((q, k) => pointSegmentDistance(p, mate[k], q)),
        )
        gaps.push(nearest - (a.width + mate[0].width) / 2)
      }
      traveled += span
    }
  }
  if (!gaps.length) throw Error("No coupled interior to audit")
  return { min: Math.min(...gaps), max: Math.max(...gaps) }
}
