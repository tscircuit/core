import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { Point, Segment, type Polygon } from "@flatten-js/core"
import type {
  PcbCopperPour,
  PcbTrace,
  Point as CircuitPoint,
  SourceTrace,
} from "circuit-json"
import { getPourPolygon } from "lib/utils/copper-pour-connectivity/copper-geometry"

const EPSILON = 1e-9
// Match findFloatingCopper so clipping edges below Flatten's mm tolerance
// remain distinguishable during geometric predicates.
const GEOMETRY_SCALE = 1e6

const isWireRoutePoint = (
  routePoint: PcbTrace["route"][number],
): routePoint is Extract<PcbTrace["route"][number], { route_type: "wire" }> =>
  routePoint.route_type === "wire"

const isTraceConnectedToSourceNet = (
  trace: PcbTrace,
  sourceNetId: string,
  sourceTraceById: Map<string, SourceTrace>,
): boolean => {
  if (trace.source_trace_id === sourceNetId) return true
  if (!trace.source_trace_id) return false

  const sourceTrace = sourceTraceById.get(trace.source_trace_id)
  if (!sourceTrace) return false

  return sourceTrace.connected_source_net_ids.includes(sourceNetId)
}

/** Segment endpoints are board-world points in mm (+X right, +Y up,
 * right-handed). The pour polygon uses the same frame scaled by GEOMETRY_SCALE.
 */
const isSegmentFullyInsideCopperPour = (
  start: CircuitPoint,
  end: CircuitPoint,
  pourPolygon: Polygon,
): boolean => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length <= EPSILON) return false

  return pourPolygon.contains(
    new Segment(
      new Point(start.x * GEOMETRY_SCALE, start.y * GEOMETRY_SCALE),
      new Point(end.x * GEOMETRY_SCALE, end.y * GEOMETRY_SCALE),
    ),
  )
}

export const markTraceSegmentsInsideCopperPour = ({
  db,
  copperPour,
}: {
  db: CircuitJsonUtilObjects
  copperPour: PcbCopperPour
}): void => {
  if (!copperPour.source_net_id) return

  const pourPolygon = getPourPolygon(copperPour).scale(
    GEOMETRY_SCALE,
    GEOMETRY_SCALE,
  )

  const sourceTraceById = new Map(
    db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
  )

  for (const trace of db.pcb_trace.list()) {
    if (
      !isTraceConnectedToSourceNet(
        trace,
        copperPour.source_net_id,
        sourceTraceById,
      )
    ) {
      continue
    }

    const coveredSegments = trace.route
      .slice(1)
      .map((toRoutePoint, segmentIndex) => {
        const fromRoutePoint = trace.route[segmentIndex]!
        if (
          !isWireRoutePoint(fromRoutePoint) ||
          !isWireRoutePoint(toRoutePoint)
        )
          return false
        if (
          fromRoutePoint.layer !== copperPour.layer ||
          toRoutePoint.layer !== copperPour.layer
        )
          return false

        return isSegmentFullyInsideCopperPour(
          fromRoutePoint,
          toRoutePoint,
          pourPolygon,
        )
      })
    if (!coveredSegments.some(Boolean)) continue

    let routeChanged = false
    const nextRoute = trace.route.map((routePoint, routePointIndex) => {
      if (!isWireRoutePoint(routePoint)) return routePoint
      // SVG consumers hide a segment when both endpoints are tagged. A shared
      // point must therefore have coverage on every adjacent segment; otherwise
      // covered neighbors could incorrectly hide an uncovered middle segment.
      const previousSegmentIsCovered =
        routePointIndex === 0 || coveredSegments[routePointIndex - 1]
      const nextSegmentIsCovered =
        routePointIndex === trace.route.length - 1 ||
        coveredSegments[routePointIndex]
      if (!previousSegmentIsCovered || !nextSegmentIsCovered) return routePoint

      routeChanged = true
      return {
        ...routePoint,
        is_inside_copper_pour: true,
        copper_pour_id: copperPour.pcb_copper_pour_id,
      }
    })

    if (routeChanged) {
      db.pcb_trace.update(trace.pcb_trace_id, { route: nextRoute })
    }
  }
}
