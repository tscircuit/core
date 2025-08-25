import type { SchematicTrace } from "circuit-json"

type Edge = SchematicTrace["edges"][number]
type TraceEdges = { id: string; edges: Edge[] }

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
 */
export function computeJunctions(
  traces: TraceEdges[],
  opts: { tolerance?: number } = {},
): Record<string, Array<{ x: number; y: number }>> {
  const tol = opts.tolerance ?? TOL
  const result: Record<string, Array<{ x: number; y: number }>> = {}
  for (const t of traces) result[t.id] = []

  // Precompute endpoints for each trace
  const endpointsByTrace = traces.map((t) => {
    const pts: Array<{ x: number; y: number }> = []
    for (const e of t.edges) {
      pts.push(e.from, e.to)
    }
    return dedupePoints(pts, tol)
  })

  for (let i = 0; i < traces.length; i++) {
    const A = traces[i]
    const AEnds = endpointsByTrace[i]
    for (let j = i + 1; j < traces.length; j++) {
      const B = traces[j]
      const BEnds = endpointsByTrace[j]

      // Endpoint-to-endpoint junctions
      for (const pa of AEnds) {
        for (const pb of BEnds) {
          if (pointEq(pa, pb, tol)) {
            result[A.id]!.push(pa)
            if (A.id !== B.id) result[B.id]!.push(pb)
          }
        }
      }

      // Endpoint of A touching interior of B
      for (const pa of AEnds) {
        for (const eB of B.edges) {
          if (onSegment(pa, eB.from, eB.to, tol)) {
            result[A.id]!.push(pa)
            if (A.id !== B.id) result[B.id]!.push(pa)
          }
        }
      }

      // Endpoint of B touching interior of A
      for (const pb of BEnds) {
        for (const eA of A.edges) {
          if (onSegment(pb, eA.from, eA.to, tol)) {
            result[B.id]!.push(pb)
            if (A.id !== B.id) result[A.id]!.push(pb)
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
