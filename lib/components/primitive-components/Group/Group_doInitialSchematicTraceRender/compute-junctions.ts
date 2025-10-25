import type { SchematicTrace } from "circuit-json"

type Edge = SchematicTrace["edges"][number]
type TraceEdges = { source_trace_id: string; edges: Edge[] }

const TOL = 1e-6

function nearlyEqual(a: number, b: number, tol = TOL) {
  return Math.abs(a - b) <= tol
}

function pointEq(
  a: { x: number; y: number },
  b: { x: number; y: number },
  tol = TOL,
) {
  return nearlyEqual(a.x, b.x, tol) && nearlyEqual(a.y, b.y, tol)
}

function onSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  tol = TOL,
) {
  // Bounding-box check
  const minX = Math.min(a.x, b.x) - tol
  const maxX = Math.max(a.x, b.x) + tol
  const minY = Math.min(a.y, b.y) - tol
  const maxY = Math.max(a.y, b.y) + tol
  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return false

  // Colinearity check via area (cross product)
  const area = Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x))
  return area <= tol
}

function dedupePoints(points: Array<{ x: number; y: number }>, tol = TOL) {
  const map = new Map<string, { x: number; y: number }>()
  for (const p of points) {
    const key = `${p.x.toFixed(6)},${p.y.toFixed(6)}`
    if (!map.has(key)) map.set(key, p)
  }
  return Array.from(map.values())
}

function edgeVec(e: Edge) {
  return { x: e.to.x - e.from.x, y: e.to.y - e.from.y }
}

function isParallel(e1: Edge, e2: Edge, tol = TOL) {
  const v1 = edgeVec(e1)
  const v2 = edgeVec(e2)
  const L1 = Math.hypot(v1.x, v1.y)
  const L2 = Math.hypot(v2.x, v2.y)
  if (L1 < tol || L2 < tol) return true
  const cross = v1.x * v2.y - v1.y * v2.x
  // Consider anti-parallel as parallel (no corner)
  return Math.abs(cross) <= tol * L1 * L2
}

function incidentEdgesAtPoint(
  trace: TraceEdges,
  p: { x: number; y: number },
  tol = TOL,
): Edge[] {
  return trace.edges.filter(
    (e) => pointEq(e.from, p, tol) || pointEq(e.to, p, tol),
  )
}

function nearestEndpointOnTrace(
  trace: TraceEdges,
  p: { x: number; y: number },
  tol = TOL,
): { x: number; y: number } | null {
  for (const e of trace.edges) {
    if (pointEq(e.from, p, tol)) return e.from
    if (pointEq(e.to, p, tol)) return e.to
  }
  return null
}

function edgeDirectionFromPoint(
  e: Edge,
  p: { x: number; y: number },
  tol = TOL,
): "up" | "down" | "left" | "right" | null {
  const other =
    pointEq(e.from, p, tol) ||
    (nearlyEqual(e.from.x, p.x, tol) && nearlyEqual(e.from.y, p.y, tol))
      ? e.to
      : e.from
  const dx = other.x - p.x
  const dy = other.y - p.y
  if (Math.abs(dx) < tol && Math.abs(dy) < tol) return null
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left"
  }
  return dy >= 0 ? "up" : "down"
}

function getCornerOrientationAtPoint(
  trace: TraceEdges,
  p: { x: number; y: number },
  tol = TOL,
): `${"up" | "down"}-${"left" | "right"}` | null {
  const incident = incidentEdgesAtPoint(trace, p, tol)
  if (incident.length < 2) return null
  // Collect unique primary directions away from point
  const dirs = incident.map((e) => edgeDirectionFromPoint(e, p, tol))
  const hasUp = dirs.includes("up" as any)
  const hasDown = dirs.includes("down" as any)
  const hasLeft = dirs.includes("left" as any)
  const hasRight = dirs.includes("right" as any)

  const vertical = hasUp ? "up" : hasDown ? "down" : null
  const horizontal = hasRight ? "right" : hasLeft ? "left" : null

  if (vertical && horizontal) {
    return `${vertical}-${horizontal}` as `${"up" | "down"}-${"left" | "right"}`
  }
  return null
}

/**
 * Compute junction points (T or shared endpoints) for a set of traces purely
 * geometrically, without relying on database lookups.
 *
 * Junctions are created when:
 * - An endpoint of one trace lies on another trace's edge (including its endpoints)
 * - Two trace endpoints coincide
 *
 * Crossings (middle-to-middle intersections) are handled by computeCrossings()
 * and are not included as junctions here.
 *
 * Optional network-awareness: callers may provide `opts.shouldConnect(traceIdA, traceIdB, atPoint)`
 * to veto junction creation between traces that are not electrically connected (e.g. different nets).
 * When omitted, all geometric T/endpoint junctions are produced as before.
 */
export function computeJunctions(
  traces: TraceEdges[],
  opts: { tolerance?: number } = {},
): Record<string, Array<{ x: number; y: number }>> {
  const tol = opts.tolerance ?? TOL
  const result: Record<string, Array<{ x: number; y: number }>> = {}
  for (const t of traces) result[t.source_trace_id] = []

  for (let i = 0; i < traces.length; i++) {
    const A = traces[i]
    const AEnds = dedupePoints(
      A.edges.flatMap((e) => [e.from, e.to]),
      tol,
    )
    for (let j = i + 1; j < traces.length; j++) {
      const B = traces[j]
      const BEnds = endpointsByTrace[j]

      // Opt-in net-aware junctions: applies only when either trace has the flag enabled
      const netAware =
        (A as any).__netAwareJunctions || (B as any).__netAwareJunctions
      if (netAware) {
        const netA = (A as any).subcircuit_connectivity_map_key
        const netB = (B as any).subcircuit_connectivity_map_key
        if (netA == null || netB == null || netA !== netB) continue
      }

      // Endpoint-to-endpoint junctions (only when forming a corner)
      for (const pa of AEnds) {
        for (const pb of BEnds) {
          if (pointEq(pa, pb, tol)) {
            const aEdgesAtP = incidentEdgesAtPoint(A, pa, tol)
            const bEdgesAtP = incidentEdgesAtPoint(B, pb, tol)
            const hasCorner = aEdgesAtP.some((eA) =>
              bEdgesAtP.some((eB) => !isParallel(eA, eB, tol)),
            )

            // If both traces have a corner at this point and the corner orientation
            // is the same (e.g. both are "up-right"), do NOT create a junction.
            const aCorner = getCornerOrientationAtPoint(A, pa, tol)
            const bCorner = getCornerOrientationAtPoint(B, pb, tol)
            const sameCornerOrientation =
              aCorner !== null && bCorner !== null && aCorner === bCorner

            if (hasCorner && !sameCornerOrientation) {
              result[A.source_trace_id]!.push(pa)
              if (A.source_trace_id !== B.source_trace_id)
                result[B.source_trace_id]!.push(pb)
            }
          }
        }
      }

      // Endpoint of A touching interior of B (only when forming a corner)
      for (const pa of AEnds) {
        for (const eB of B.edges) {
          if (onSegment(pa, eB.from, eB.to, tol)) {
            const aEdgesAtP = incidentEdgesAtPoint(A, pa, tol)
            const hasCorner = aEdgesAtP.some((eA) => !isParallel(eA, eB, tol))
            const aCorner = getCornerOrientationAtPoint(A, pa, tol)
            // If B has a corner very close to this point with the same orientation, skip junction
            const bEndpointNearPa = nearestEndpointOnTrace(B, pa, tol * 1000)
            const bCorner = bEndpointNearPa
              ? getCornerOrientationAtPoint(B, bEndpointNearPa, tol)
              : null
            const sameCornerOrientation =
              aCorner !== null && bCorner !== null && aCorner === bCorner
            if (hasCorner && !sameCornerOrientation) {
              result[A.source_trace_id]!.push(pa)
              if (A.source_trace_id !== B.source_trace_id)
                result[B.source_trace_id]!.push(pa)
            }
          }
        }
      }

      // Endpoint of B touching interior of A (only when forming a corner)
      for (const pb of BEnds) {
        for (const eA of A.edges) {
          if (onSegment(pb, eA.from, eA.to, tol)) {
            const bEdgesAtP = incidentEdgesAtPoint(B, pb, tol)
            const hasCorner = bEdgesAtP.some((eB) => !isParallel(eA, eB, tol))
            const bCorner = getCornerOrientationAtPoint(B, pb, tol)
            // If A has a corner very close to this point with the same orientation, skip junction
            const aEndpointNearPb = nearestEndpointOnTrace(A, pb, tol * 1000)
            const aCorner = aEndpointNearPb
              ? getCornerOrientationAtPoint(A, aEndpointNearPb, tol)
              : null
            const sameCornerOrientation =
              aCorner !== null && bCorner !== null && aCorner === bCorner
            if (hasCorner && !sameCornerOrientation) {
              result[B.source_trace_id]!.push(pb)
              if (A.source_trace_id !== B.source_trace_id)
                result[A.source_trace_id]!.push(pb)
            }
          }
        }
      }
    }
  }

  // Dedupe
  for (const id of Object.keys(result)) {
    result[id] = dedupePoints(result[id]!, tol)
  }

  return result
}
