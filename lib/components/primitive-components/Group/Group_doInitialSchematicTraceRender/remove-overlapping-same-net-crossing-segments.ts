import type { SchematicTrace } from "circuit-json"
import {
  length,
  mergeIntervals,
  paramAlong,
  pointAt,
} from "./compute-crossings"

type Edge = SchematicTrace["edges"][number]
type TraceEdges = {
  schematic_trace_id?: string
  source_trace_id: string
  edges: Edge[]
  connectivity_key?: string
}

const TOL = 1e-6

function isCollinear(a: Edge, b: Edge, tol = TOL) {
  const adx = a.to.x - a.from.x
  const ady = a.to.y - a.from.y
  const bdx = b.to.x - b.from.x
  const bdy = b.to.y - b.from.y
  const aLen = Math.hypot(adx, ady)
  const bLen = Math.hypot(bdx, bdy)
  if (aLen <= tol || bLen <= tol) return false

  const directionCross = adx * bdy - ady * bdx
  if (Math.abs(directionCross) > tol * aLen * bLen) return false

  const offsetCross = adx * (b.from.y - a.from.y) - ady * (b.from.x - a.from.x)
  return Math.abs(offsetCross) <= tol * aLen
}

function splitEdgeAroundIntervals(
  edge: Edge,
  intervals: Array<{ start: number; end: number }>,
) {
  const merged = mergeIntervals(intervals)
  if (merged.length === 0) return [edge]

  const edgeLength = length(edge.from, edge.to)
  if (edgeLength <= TOL) return [edge]

  const result: Edge[] = []
  let cursor = 0
  for (const interval of merged) {
    if (interval.start - cursor > TOL) {
      result.push({
        from: pointAt(edge.from, edge.to, cursor / edgeLength),
        to: pointAt(edge.from, edge.to, interval.start / edgeLength),
      })
    }
    if (interval.end - interval.start > TOL) {
      result.push({
        from: pointAt(edge.from, edge.to, interval.start / edgeLength),
        to: pointAt(edge.from, edge.to, interval.end / edgeLength),
        is_crossing: true,
      })
    }
    cursor = Math.max(cursor, interval.end)
  }
  if (edgeLength - cursor > TOL) {
    result.push({
      from: pointAt(edge.from, edge.to, cursor / edgeLength),
      to: edge.to,
    })
  }
  return result
}

/**
 * A crossing edge is rendered as a hop overlay, while the base trace path is
 * intentionally broken at that edge. If another trace on the same net has a
 * collinear segment under that break, it can show through the hop. Mark the
 * covered same-net span as a crossing too, so the base trace path breaks there
 * instead of rendering a straight line behind the hop.
 */
export function removeOverlappingSameNetCrossingSegments(
  traces: TraceEdges[],
): TraceEdges[] {
  const intervalsToRemove = new Map<
    string,
    Array<{ start: number; end: number }>
  >()

  for (
    let crossingTraceIndex = 0;
    crossingTraceIndex < traces.length;
    crossingTraceIndex++
  ) {
    const crossingTrace = traces[crossingTraceIndex]!
    if (!crossingTrace.connectivity_key) continue

    for (const crossingEdge of crossingTrace.edges) {
      if (
        !crossingEdge.is_crossing ||
        length(crossingEdge.from, crossingEdge.to) <= TOL
      )
        continue

      for (let traceIndex = 0; traceIndex < traces.length; traceIndex++) {
        const candidateTrace = traces[traceIndex]!
        if (
          traceIndex === crossingTraceIndex ||
          candidateTrace.connectivity_key !== crossingTrace.connectivity_key
        ) {
          continue
        }

        for (
          let edgeIndex = 0;
          edgeIndex < candidateTrace.edges.length;
          edgeIndex++
        ) {
          const candidateEdge = candidateTrace.edges[edgeIndex]!
          const candidateLength = length(candidateEdge.from, candidateEdge.to)
          if (candidateEdge.is_crossing || candidateLength <= TOL) continue
          if (!isCollinear(candidateEdge, crossingEdge)) continue

          const start = Math.max(
            0,
            Math.min(
              paramAlong(
                candidateEdge.from,
                candidateEdge.to,
                crossingEdge.from,
              ),
              paramAlong(candidateEdge.from, candidateEdge.to, crossingEdge.to),
            ),
          )
          const end = Math.min(
            candidateLength,
            Math.max(
              paramAlong(
                candidateEdge.from,
                candidateEdge.to,
                crossingEdge.from,
              ),
              paramAlong(candidateEdge.from, candidateEdge.to, crossingEdge.to),
            ),
          )
          if (end - start <= TOL) continue

          const key = `${traceIndex}:${edgeIndex}`
          const intervals = intervalsToRemove.get(key) ?? []
          intervals.push({ start, end })
          intervalsToRemove.set(key, intervals)
        }
      }
    }
  }

  if (intervalsToRemove.size === 0) return traces
  return traces.map((trace, traceIndex) => ({
    ...trace,
    edges: trace.edges.flatMap((edge, edgeIndex) => {
      const intervals = intervalsToRemove.get(`${traceIndex}:${edgeIndex}`)
      return intervals ? splitEdgeAroundIntervals(edge, intervals) : [edge]
    }),
  }))
}
