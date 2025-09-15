import type { SchematicTrace } from "circuit-json"

type Edge = SchematicTrace["edges"][number]
type TraceEdges = { source_trace_id: string; edges: Edge[] }

const TOL = 1e-6

function isHorizontalEdge(edge: Edge): boolean {
  const dx = Math.abs(edge.to.x - edge.from.x)
  const dy = Math.abs(edge.to.y - edge.from.y)
  return dx >= dy
}

function nearlyEqual(a: number, b: number, tol = TOL) {
  return Math.abs(a - b) <= tol
}

function length(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pointAt(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function paramAlong(
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: { x: number; y: number },
) {
  const L = length(a, b)
  if (L < TOL) return 0
  // projection factor t in [0,1]
  const t =
    ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) /
    ((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y))
  return Math.max(0, Math.min(1, t)) * L
}

function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx
}

function segmentIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  q1: { x: number; y: number },
  q2: { x: number; y: number },
): { x: number; y: number } | null {
  const r = { x: p2.x - p1.x, y: p2.y - p1.y }
  const s = { x: q2.x - q1.x, y: q2.y - q1.y }
  const rxs = cross(r.x, r.y, s.x, s.y)
  const q_p = { x: q1.x - p1.x, y: q1.y - p1.y }
  const q_pxr = cross(q_p.x, q_p.y, r.x, r.y)

  if (Math.abs(rxs) < TOL && Math.abs(q_pxr) < TOL) {
    // Colinear - ignore as crossing (we don't generate crossings for overlap)
    return null
  }
  if (Math.abs(rxs) < TOL && Math.abs(q_pxr) >= TOL) {
    // Parallel non-intersecting
    return null
  }

  const t = cross(q_p.x, q_p.y, s.x, s.y) / rxs
  const u = cross(q_p.x, q_p.y, r.x, r.y) / rxs

  if (t < -TOL || t > 1 + TOL || u < -TOL || u > 1 + TOL) return null

  const pt = { x: p1.x + t * r.x, y: p1.y + t * r.y }
  return pt
}

function mergeIntervals(
  intervals: Array<{ start: number; end: number }>,
  tol = TOL,
) {
  if (intervals.length === 0) return intervals
  intervals.sort((a, b) => a.start - b.start)
  const merged: typeof intervals = []
  let cur = { ...intervals[0] }
  for (let i = 1; i < intervals.length; i++) {
    const nxt = intervals[i]
    if (nxt.start <= cur.end + tol) {
      cur.end = Math.max(cur.end, nxt.end)
    } else {
      merged.push(cur)
      cur = { ...nxt }
    }
  }
  merged.push(cur)
  return merged
}

function splitEdgeByCrossings(
  edge: Edge,
  crossingDistances: number[],
  crossLen: number,
): Edge[] {
  const L = length(edge.from, edge.to)
  if (L < TOL || crossingDistances.length === 0) return [edge]

  // Build target crossing intervals around each crossing distance
  const half = crossLen / 2
  const rawIntervals = crossingDistances
    .map((d) => ({
      start: Math.max(0, d - half),
      end: Math.min(L, d + half),
    }))
    // filter invalid intervals
    .filter((iv) => iv.end - iv.start > TOL)

  const intervals = mergeIntervals(rawIntervals)

  // Build segments
  const result: Edge[] = []
  let cursor = 0

  const dir = { x: edge.to.x - edge.from.x, y: edge.to.y - edge.from.y }

  const addSeg = (d0: number, d1: number, isCrossing: boolean) => {
    if (d1 - d0 <= TOL) return
    const t0 = d0 / L
    const t1 = d1 / L
    result.push({
      from: pointAt(edge.from, edge.to, t0),
      to: pointAt(edge.from, edge.to, t1),
      ...(isCrossing ? { is_crossing: true as const } : {}),
    })
  }

  for (const iv of intervals) {
    if (iv.start - cursor > TOL) {
      addSeg(cursor, iv.start, false)
    }
    addSeg(iv.start, iv.end, true)
    cursor = iv.end
  }
  if (L - cursor > TOL) {
    addSeg(cursor, L, false)
  }

  // If for some reason no segments produced, fallback original
  return result.length > 0 ? result : [edge]
}

/**
 * Compute crossing segments for a set of traces purely geometrically.
 * Inserts short segments flagged with is_crossing where traces intersect
 * away from endpoints. Does not consult the database.
 */
export function computeCrossings(
  traces: TraceEdges[],
  opts: { crossSegmentLength?: number; tolerance?: number } = {},
): TraceEdges[] {
  const crossLen = opts.crossSegmentLength ?? 0.075
  const tol = opts.tolerance ?? TOL

  // Collect intersections per edge reference
  type EdgeRef = { traceIdx: number; edgeIdx: number }
  const crossingsByEdge = new Map<string, number[]>()
  const keyOf = (ref: EdgeRef) => `${ref.traceIdx}:${ref.edgeIdx}`

  const getEdge = (ref: EdgeRef) => traces[ref.traceIdx].edges[ref.edgeIdx]

  // Enumerate all edge pairs
  for (let ti = 0; ti < traces.length; ti++) {
    const A = traces[ti]
    for (let ei = 0; ei < A.edges.length; ei++) {
      const eA = A.edges[ei]
      for (let tj = ti; tj < traces.length; tj++) {
        const B = traces[tj]
        // Skip same-trace intersections if needed? Allow but treat only as non-endpoint crossings
        for (let ej = tj === ti ? ei + 1 : 0; ej < B.edges.length; ej++) {
          const eB = B.edges[ej]

          const P = segmentIntersection(eA.from, eA.to, eB.from, eB.to)
          if (!P) continue

          const LA = length(eA.from, eA.to)
          const LB = length(eB.from, eB.to)
          if (LA < tol || LB < tol) continue

          const dA = paramAlong(eA.from, eA.to, P) // distance along A
          const dB = paramAlong(eB.from, eB.to, P) // distance along B

          const nearEndpointA =
            dA <= tol || Math.abs(LA - dA) <= tol || Number.isNaN(dA)
          const nearEndpointB =
            dB <= tol || Math.abs(LB - dB) <= tol || Number.isNaN(dB)

          // Crossing is when both are away from endpoints
          if (!nearEndpointA && !nearEndpointB) {
            // Only one of the traces should receive the crossing marker.
            // Prefer assigning the crossing to the more horizontal edge.
            const aIsHorizontal = isHorizontalEdge(eA)
            const bIsHorizontal = isHorizontalEdge(eB)

            let assignToA: boolean
            if (aIsHorizontal !== bIsHorizontal) {
              // If exactly one is horizontal, prefer the horizontal one
              assignToA = aIsHorizontal
            } else {
              // Otherwise break ties deterministically by preferring the edge
              // with stronger horizontal component, and finally A.
              const ax = Math.abs(eA.to.x - eA.from.x)
              const ay = Math.abs(eA.to.y - eA.from.y)
              const bx = Math.abs(eB.to.x - eB.from.x)
              const by = Math.abs(eB.to.y - eB.from.y)
              const aScore = ax - ay
              const bScore = bx - by
              assignToA = aScore === bScore ? true : aScore > bScore
            }

            const chosenKey = keyOf({
              traceIdx: assignToA ? ti : tj,
              edgeIdx: assignToA ? ei : ej,
            })
            const chosenList = crossingsByEdge.get(chosenKey) ?? []
            chosenList.push(assignToA ? dA : dB)
            crossingsByEdge.set(chosenKey, chosenList)
          }
        }
      }
    }
  }

  // Build new traces with crossings inserted
  const out: TraceEdges[] = traces.map((t) => ({
    source_trace_id: t.source_trace_id,
    edges: [],
  }))

  for (let ti = 0; ti < traces.length; ti++) {
    const trace = traces[ti]
    for (let ei = 0; ei < trace.edges.length; ei++) {
      const eRefKey = keyOf({ traceIdx: ti, edgeIdx: ei })
      const splittingDistances = crossingsByEdge.get(eRefKey) ?? []
      if (splittingDistances.length === 0) {
        out[ti]!.edges.push(trace.edges[ei]!)
        continue
      }
      // Sort and unique distances
      const uniqueSorted = Array.from(
        new Set(splittingDistances.map((d) => Number(d.toFixed(6)))),
      ).sort((a, b) => a - b)

      const split = splitEdgeByCrossings(
        trace.edges[ei]!,
        uniqueSorted,
        crossLen,
      )
      out[ti]!.edges.push(...split)
    }
  }

  return out
}
