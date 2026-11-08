import type { Point, SystemBlockRoutePoint } from "circuit-json"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

/** Axis-aligned obstacle bounds in page-local mm (+X right, +Y up). */
export interface SystemBlockRouteObstacle {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const EPSILON = 1e-8

/**
 * Round a resolved polyline with circle-derived cubic segments, targeting 12 mm.
 * Inputs, endpoints, and controls are points in page-local diagram mm, +X right,
 * +Y up (right-handed XY, +Z out of page). Internal unit vectors are directions.
 * Fillets stay inside each corner's trim triangle, so page bounds cannot grow.
 * Obstacle checks conservatively use that triangle's axis-aligned bounds.
 * Neighboring wire bounds retain up to 3 mm clearance, capped by the existing
 * corner's clearance so a nearby wire does not prevent rounding away from it.
 */
export function roundSystemBlockRoute(
  route: Point[],
  obstacles: SystemBlockRouteObstacle[],
  wireObstacles: SystemBlockRouteObstacle[] = [],
): SystemBlockRoutePoint[] {
  const points: Point[] = []
  for (const point of route) {
    if (points.length && distance(points.at(-1)!, point) < EPSILON) continue
    // Collinear Dagre waypoints should not artificially constrain the radius.
    while (points.length >= 2) {
      const a = points.at(-2)!
      const b = points.at(-1)!
      const incoming = unitDirection(a, b)
      const outgoing = unitDirection(b, point)
      if (
        Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x) > EPSILON ||
        incoming.x * outgoing.x + incoming.y * outgoing.y <= 0
      )
        break
      points.pop()
    }
    points.push(point)
  }
  if (points.length < 3) return points.map((point) => ({ ...point }))
  const rounded: SystemBlockRoutePoint[] = [{ ...points[0] }]
  const append = (point: SystemBlockRoutePoint) => {
    if (
      point.cubic_bezier_control_points ||
      distance(rounded.at(-1)!, point) > EPSILON
    )
      rounded.push(point)
  }
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1]
    const corner = points[index]
    const next = points[index + 1]
    const cornerObstacles = [
      ...obstacles,
      ...wireObstacles.map((wire) => {
        const clearance = Math.min(
          3,
          Math.max(
            0,
            wire.minX - corner.x,
            corner.x - wire.maxX,
            wire.minY - corner.y,
            corner.y - wire.maxY,
          ),
        )
        return {
          minX: wire.minX - clearance,
          maxX: wire.maxX + clearance,
          minY: wire.minY - clearance,
          maxY: wire.maxY + clearance,
        }
      }),
    ]
    const incoming = unitDirection(previous, corner)
    const outgoing = unitDirection(corner, next)
    const turn = Math.atan2(
      incoming.x * outgoing.y - incoming.y * outgoing.x,
      incoming.x * outgoing.x + incoming.y * outgoing.y,
    )
    // A reversal needs a different routing skeleton, not an infinite-radius trim.
    if (Math.abs(turn) < EPSILON || Math.PI - Math.abs(turn) < EPSILON) {
      append({ ...corner })
      continue
    }
    const tangent = Math.tan(Math.abs(turn) / 2)
    let trim = Math.min(
      12 * tangent,
      distance(previous, corner) / 2,
      distance(corner, next) / 2,
    )
    let start: Point
    let end: Point
    while (true) {
      start = {
        x: corner.x - incoming.x * trim,
        y: corner.y - incoming.y * trim,
      }
      end = { x: corner.x + outgoing.x * trim, y: corner.y + outgoing.y * trim }
      const minX = Math.min(start.x, corner.x, end.x)
      const maxX = Math.max(start.x, corner.x, end.x)
      const minY = Math.min(start.y, corner.y, end.y)
      const maxY = Math.max(start.y, corner.y, end.y)
      const blocked = cornerObstacles.some(
        (obstacle) =>
          minX < obstacle.maxX &&
          maxX > obstacle.minX &&
          minY < obstacle.maxY &&
          maxY > obstacle.minY,
      )
      if (!blocked || trim < 0.001) break
      trim /= 2
    }
    if (trim < 0.001) {
      append({ ...corner })
      continue
    }
    append(start)
    const radius = trim / tangent
    const sign = Math.sign(turn)
    const center = {
      x: start.x - incoming.y * sign * radius,
      y: start.y + incoming.x * sign * radius,
    }
    const count = Math.ceil(Math.abs(turn) / (Math.PI / 2))
    const sweep = turn / count
    const handle = (4 / 3) * radius * Math.tan(Math.abs(sweep) / 4)
    for (let arc = 0; arc < count; arc++) {
      const from = rounded.at(-1)!
      // Rotation about the circle center transforms points; pure rotation below
      // transforms tangent directions without translating them.
      const to =
        arc === count - 1
          ? end
          : applyToPoint(
              compose(
                translate(center.x, center.y),
                rotate((arc + 1) * sweep),
                translate(-center.x, -center.y),
              ),
              start,
            )
      const departure = applyToPoint(rotate(arc * sweep), incoming)
      const arrival = applyToPoint(rotate((arc + 1) * sweep), incoming)
      append({
        ...to,
        cubic_bezier_control_points: [
          {
            x: from.x + departure.x * handle,
            y: from.y + departure.y * handle,
          },
          { x: to.x - arrival.x * handle, y: to.y - arrival.y * handle },
        ],
      })
    }
  }
  append({ ...points.at(-1)! })
  return rounded
}

/** Distance between page-local points in diagram mm. */
function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Unit direction from a to b in the page's +X-right, +Y-up frame. */
function unitDirection(a: Point, b: Point): Point {
  const length = distance(a, b)
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
}
