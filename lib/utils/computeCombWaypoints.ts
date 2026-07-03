export type CombOrientation =
  | "columnToColumn"
  | "rowToColumn"
  | "columnToRow"
  | "rowToRow"

type Pt = { x: number; y: number }

const monotone = (vals: number[], sgn: number) =>
  vals.every((v, i) => i === 0 || sgn * (v - vals[i - 1]) >= -1e-6)

/**
 * The two interior bend points of a comb trace between two pads, in board coordinates: a
 * perpendicular escape stub off the source, one 45° diagonal covering the offset, then a
 * perpendicular landing into the target. The pads are the route's endpoints (added by the
 * caller); only these two corners are returned, so the drawn path is straight → 45° → straight.
 *
 * `orientation` is <sourceLine>To<targetLine>: a COLUMN of pads (stacked, shared x) escapes
 * perpendicular in x, a ROW (spread, shared y) in y. The perpendicular escape is what lets a
 * bundle clear rectangular SMD lands before it turns, so N of these nest into an even comb.
 *
 * Returns null when the fixed shape can't reach the target without backtracking — e.g. a
 * diverging fan whose perpendicular offset exceeds the gap it has to close. The caller then
 * leaves the trace unrouted so the autorouter handles it, rather than drawing overshooting copper.
 */
export function computeCombWaypoints(
  s: Pt,
  t: Pt,
  orientation: CombOrientation,
  stub = 1,
): Pt[] | null {
  const sgx = Math.sign(t.x - s.x) || 1
  const sgy = Math.sign(t.y - s.y) || 1
  let p1: Pt
  let p2: Pt
  if (orientation === "columnToColumn") {
    // escape x, land x — diagonal spans y
    const x1 = s.x + sgx * stub
    p1 = { x: x1, y: s.y }
    p2 = { x: x1 + sgx * Math.abs(t.y - s.y), y: t.y }
  } else if (orientation === "rowToRow") {
    // escape y, land y — diagonal spans x
    const y1 = s.y + sgy * stub
    p1 = { x: s.x, y: y1 }
    p2 = { x: t.x, y: y1 + sgy * Math.abs(t.x - s.x) }
  } else if (orientation === "rowToColumn") {
    // escape y, land x
    const y1 = s.y + sgy * stub
    p1 = { x: s.x, y: y1 }
    p2 = { x: s.x + sgx * Math.abs(t.y - y1), y: t.y }
  } else if (orientation === "columnToRow") {
    // escape x, land y
    const x1 = s.x + sgx * stub
    p1 = { x: x1, y: s.y }
    p2 = { x: t.x, y: s.y + sgy * Math.abs(t.x - x1) }
  } else {
    return null
  }
  // A comb never backtracks: x and y must each progress monotonically source→target across
  // pad → escape → diagonal → land. If not, the fixed shape doesn't fit here.
  if (
    !monotone([s.x, p1.x, p2.x, t.x], sgx) ||
    !monotone([s.y, p1.y, p2.y, t.y], sgy)
  )
    return null
  return [p1, p2]
}
