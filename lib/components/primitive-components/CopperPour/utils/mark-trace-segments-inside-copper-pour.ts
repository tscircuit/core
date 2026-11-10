/** Geometry uses board-world points in mm: +X right, +Y up, +Z above (right handed). */
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  PcbCopperPour,
  PcbCopperPourBRep,
  PcbCopperPourRect,
  PcbTrace,
  PcbTraceRoutePoint,
  PcbTraceRoutePointWire,
  Point,
  SourceNet,
  SourceTrace,
} from "circuit-json"

const EPSILON = 1e-9

type SourceNetId = SourceNet["source_net_id"]
type SourceTraceId = SourceTrace["source_trace_id"]
type WirePointKey = `${PcbTraceRoutePointWire["layer"]}:${number}:${number}`

const isWireRoutePoint = (
  routePoint: PcbTraceRoutePoint,
): routePoint is PcbTraceRoutePointWire => routePoint.route_type === "wire"

/** Board-world point in mm: +X right, +Y up, +Z above the PCB (right handed). */
const getWirePointKey = (point: PcbTraceRoutePointWire): WirePointKey =>
  `${point.layer}:${point.x}:${point.y}`

const isPointOnSegment = (p: Point, a: Point, b: Point): boolean => {
  if (Math.hypot(b.x - a.x, b.y - a.y) <= EPSILON) {
    return Math.hypot(p.x - a.x, p.y - a.y) <= EPSILON
  }
  const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y)
  if (Math.abs(cross) > EPSILON) return false

  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
  if (dot < -EPSILON) return false

  const squaredLength = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (dot - squaredLength > EPSILON) return false

  return true
}

const isPointInRing = (point: Point, ring: Point[]): boolean => {
  if (ring.length < 3) return false

  let inside = false
  let previous = ring[ring.length - 1]!
  for (const current of ring) {
    if (isPointOnSegment(point, previous, current)) return true

    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x

    if (intersects) inside = !inside
    previous = current
  }
  return inside
}

const isPointInRectPour = (p: Point, pour: PcbCopperPourRect): boolean => {
  const { center, width, height } = pour
  const rotationRad = ((pour.rotation ?? 0) * Math.PI) / 180
  const cosR = Math.cos(-rotationRad)
  const sinR = Math.sin(-rotationRad)

  const dx = p.x - center.x
  const dy = p.y - center.y
  const localX = dx * cosR - dy * sinR
  const localY = dx * sinR + dy * cosR

  return (
    Math.abs(localX) <= width / 2 + EPSILON &&
    Math.abs(localY) <= height / 2 + EPSILON
  )
}

const isPointInBrepPour = (p: Point, pour: PcbCopperPourBRep): boolean => {
  return (
    isPointInRing(p, pour.brep_shape.outer_ring.vertices) &&
    !pour.brep_shape.inner_rings.some((ring) => isPointInRing(p, ring.vertices))
  )
}

const isPointInCopperPour = (point: Point, pour: PcbCopperPour): boolean => {
  if (pour.shape === "rect") {
    return isPointInRectPour(point, pour)
  }
  if (pour.shape === "brep") {
    return isPointInBrepPour(point, pour)
  }
  return false
}

const isTraceConnectedToSourceNet = (
  trace: PcbTrace,
  sourceNetId: SourceNetId,
  sourceTraceById: ReadonlyMap<SourceTraceId, SourceTrace>,
): boolean => {
  if (trace.source_trace_id === sourceNetId) return true
  if (!trace.source_trace_id) return false

  const sourceTrace = sourceTraceById.get(trace.source_trace_id)
  if (!sourceTrace) return false

  return sourceTrace.connected_source_net_ids.includes(sourceNetId)
}

/** Board-world XY points in mm: +X right, +Y up, +Z above the PCB (right handed). */
const isSegmentFullyInsideCopperPour = (
  start: Point,
  end: Point,
  pour: PcbCopperPour,
): boolean => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length <= EPSILON) return false

  if (!isPointInCopperPour(start, pour) || !isPointInCopperPour(end, pour)) {
    return false
  }

  // Rectangles are convex; endpoint containment is sufficient. BReps may have
  // narrow holes or concave notches between any fixed set of sample points.
  if (pour.shape === "rect") return true
  if (pour.shape !== "brep") return false

  for (const ring of [
    pour.brep_shape.outer_ring,
    ...pour.brep_shape.inner_rings,
  ]) {
    const vertices = ring.vertices
    for (let edgeIndex = 0; edgeIndex < vertices.length; edgeIndex++) {
      if (
        doesTraceSegmentTouchPourBoundaryEdge(
          start,
          end,
          vertices[edgeIndex],
          vertices[(edgeIndex + 1) % vertices.length],
        )
      )
        return false
    }
  }
  return true
}

/**
 * Board-world XY points in mm: +X right, +Y up, +Z above the PCB (right handed).
 * Conservatively keep boundary contacts visible, including collinear runs.
 */
const doesTraceSegmentTouchPourBoundaryEdge = (
  traceStart: Point,
  traceEnd: Point,
  boundaryStart: Point,
  boundaryEnd: Point,
): boolean => {
  if (
    isPointOnSegment(traceStart, boundaryStart, boundaryEnd) ||
    isPointOnSegment(traceEnd, boundaryStart, boundaryEnd) ||
    isPointOnSegment(boundaryStart, traceStart, traceEnd) ||
    isPointOnSegment(boundaryEnd, traceStart, traceEnd)
  )
    return true

  const side = (start: Point, end: Point, point: Point) =>
    (end.x - start.x) * (point.y - start.y) -
    (end.y - start.y) * (point.x - start.x)
  const oppositeSides = (first: number, second: number) =>
    (first > EPSILON && second < -EPSILON) ||
    (first < -EPSILON && second > EPSILON)
  return (
    oppositeSides(
      side(traceStart, traceEnd, boundaryStart),
      side(traceStart, traceEnd, boundaryEnd),
    ) &&
    oppositeSides(
      side(boundaryStart, boundaryEnd, traceStart),
      side(boundaryStart, boundaryEnd, traceEnd),
    )
  )
}

export const markTraceSegmentsInsideCopperPour = ({
  db,
  copperPour,
}: {
  db: CircuitJsonUtilObjects
  copperPour: PcbCopperPour
}): void => {
  const sourceNetId = copperPour.source_net_id
  if (!sourceNetId) return

  const sourceTraceById = new Map(
    db.source_trace
      .list()
      .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
  )

  const traceCoverage = db.pcb_trace
    .list()
    .filter((trace) =>
      isTraceConnectedToSourceNet(trace, sourceNetId, sourceTraceById),
    )
    .map((trace) => ({
      trace,
      coveredSegments: trace.route.slice(0, -1).map((from, segmentIndex) => {
        const to = trace.route[segmentIndex + 1]
        return (
          isWireRoutePoint(from) &&
          isWireRoutePoint(to) &&
          from.layer === copperPour.layer &&
          to.layer === copperPour.layer &&
          isSegmentFullyInsideCopperPour(from, to, copperPour)
        )
      }),
    }))

  // The router may split adjacent spans into separate PCB and source traces.
  // A shared point stays exposed if any span on this net and layer is uncovered.
  const exposedPoints = new Set<WirePointKey>()
  for (const { trace, coveredSegments } of traceCoverage) {
    for (const [routeIndex, point] of trace.route.entries()) {
      const coveredBefore = routeIndex === 0 || coveredSegments[routeIndex - 1]
      const coveredAfter =
        routeIndex === trace.route.length - 1 || coveredSegments[routeIndex]
      if (isWireRoutePoint(point) && (!coveredBefore || !coveredAfter)) {
        exposedPoints.add(getWirePointKey(point))
      }
    }
  }

  for (const { trace, coveredSegments } of traceCoverage) {
    let routeChanged = false
    const nextRoute = trace.route.map((routePoint) => {
      const point = { ...routePoint }
      if (
        isWireRoutePoint(point) &&
        coveredSegments.length > 0 &&
        !exposedPoints.has(getWirePointKey(point))
      ) {
        point.is_inside_copper_pour = true
        point.copper_pour_id = copperPour.pcb_copper_pour_id
        routeChanged = true
      }
      return point
    })

    if (routeChanged) {
      db.pcb_trace.update(trace.pcb_trace_id, { route: nextRoute })
    }
  }
}
