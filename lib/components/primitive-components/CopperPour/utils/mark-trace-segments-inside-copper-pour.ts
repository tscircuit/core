import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type {
  PcbCopperPour,
  PcbCopperPourBRep,
  PcbCopperPourRect,
  PcbTrace,
  SourceTrace,
} from "circuit-json"

const EPSILON = 1e-9

type Point = { x: number; y: number }

const isWireRoutePoint = (
  routePoint: PcbTrace["route"][number],
): routePoint is Extract<PcbTrace["route"][number], { route_type: "wire" }> =>
  routePoint.route_type === "wire"

const isPointOnSegment = (p: Point, a: Point, b: Point): boolean => {
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
  const outerRing = pour.brep_shape.outer_ring.vertices.map((v) => ({
    x: v.x,
    y: v.y,
  }))
  if (!isPointInRing(p, outerRing)) return false

  for (const innerRing of pour.brep_shape.inner_rings) {
    const points = innerRing.vertices.map((v) => ({ x: v.x, y: v.y }))
    if (isPointInRing(p, points)) return false
  }

  return true
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
  sourceNetId: string,
  sourceTraceById: Map<string, SourceTrace>,
): boolean => {
  if (trace.source_trace_id === sourceNetId) return true
  if (!trace.source_trace_id) return false

  const sourceTrace = sourceTraceById.get(trace.source_trace_id)
  if (!sourceTrace) return false

  return sourceTrace.connected_source_net_ids.includes(sourceNetId)
}

const isSegmentFullyInsideCopperPour = (
  start: Point,
  end: Point,
  pour: PcbCopperPour,
): boolean => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length <= EPSILON) return false

  const samples = [0, 0.25, 0.5, 0.75, 1]
  return samples.every((t) =>
    isPointInCopperPour(
      {
        x: start.x + dx * t,
        y: start.y + dy * t,
      },
      pour,
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
          copperPour,
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
