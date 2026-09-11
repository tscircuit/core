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

    let routeChanged = false
    const nextRoute = trace.route.map((routePoint) => ({ ...routePoint }))

    for (let i = 0; i < nextRoute.length - 1; i++) {
      const fromRoutePoint = nextRoute[i]
      const toRoutePoint = nextRoute[i + 1]
      if (!fromRoutePoint || !toRoutePoint) continue
      if (!isWireRoutePoint(fromRoutePoint) || !isWireRoutePoint(toRoutePoint))
        continue
      if (
        fromRoutePoint.layer !== copperPour.layer ||
        toRoutePoint.layer !== copperPour.layer
      )
        continue

      if (
        isSegmentFullyInsideCopperPour(
          { x: fromRoutePoint.x, y: fromRoutePoint.y },
          { x: toRoutePoint.x, y: toRoutePoint.y },
          pourPolygon,
        )
      ) {
        fromRoutePoint.is_inside_copper_pour = true
        fromRoutePoint.copper_pour_id = copperPour.pcb_copper_pour_id
        toRoutePoint.is_inside_copper_pour = true
        toRoutePoint.copper_pour_id = copperPour.pcb_copper_pour_id
        routeChanged = true
      }
    }

    if (routeChanged) {
      db.pcb_trace.update(trace.pcb_trace_id, { route: nextRoute })
    }
  }
}
