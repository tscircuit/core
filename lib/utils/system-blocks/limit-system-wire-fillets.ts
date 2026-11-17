import type { Point, SystemBlockRoutePoint } from "circuit-json"
import { roundSystemBlockRoute } from "./round-system-block-route"

type Segment = readonly [Point, Point]

/** Preferred gap between two wires, in diagram mm. */
const WIRE_CLEARANCE = 3
/** Allowance for comparing arcs through their sampled chords, in diagram mm. */
const SAMPLING_SLACK = 0.05

/** Sample emitted straight and cubic pieces as chords (page-local mm points). */
export function sampleSystemBlockRoute(
  route: SystemBlockRoutePoint[],
): Point[] {
  const sampled: Point[] = [{ x: route[0].x, y: route[0].y }]
  for (let index = 1; index < route.length; index++) {
    const end = route[index]
    const controls = end.cubic_bezier_control_points
    if (!controls) {
      sampled.push({ x: end.x, y: end.y })
      continue
    }
    const start = route[index - 1]
    const [a, b] = controls
    for (let step = 1; step <= 8; step++) {
      const t = step / 8
      const s = 1 - t
      sampled.push({
        x:
          s ** 3 * start.x +
          3 * s * s * t * a.x +
          3 * s * t * t * b.x +
          t ** 3 * end.x,
        y:
          s ** 3 * start.y +
          3 * s * s * t * a.y +
          3 * s * t * t * b.y +
          t ** 3 * end.y,
      })
    }
  }
  return sampled
}

const segmentsOf = (points: Point[]): Segment[] =>
  points.slice(1).map((end, index) => [points[index], end] as const)

const pointToSegment = (p: Point, [a, b]: Segment) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(
        0,
        Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared),
      )
    : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}

const segmentDistance = (first: Segment, second: Segment) => {
  const side = (a: Point, b: Point, c: Point) =>
    Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
  const [a, b] = first
  const [c, d] = second
  if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0)
    return 0
  return Math.min(
    pointToSegment(a, second),
    pointToSegment(b, second),
    pointToSegment(c, first),
    pointToSegment(d, first),
  )
}

/**
 * Reduce fillet trims until rounded wires keep their clearance to each other.
 * A fillet only moves a wire toward the inside of its corner, so a corner is
 * shortened when its arc comes closer to another wire than the sharp corner
 * was, and closer than 3 mm. Nested corners therefore keep concentric fillets
 * instead of leaving the outer wire angular. Neighbors are compared in their
 * rounded form; `fixed` holds sampled wires whose shape cannot change.
 * Routes are orthogonal polylines in page-centered diagram mm (+X right, +Y up).
 * `trims[i]` belongs to `route[i]` and is updated in place.
 */
export function limitSystemWireFillets(
  wires: { route: Point[]; trims: number[] }[],
  fixed: Point[][],
) {
  const shape = (wire: { route: Point[]; trims: number[] }) =>
    segmentsOf(
      sampleSystemBlockRoute(
        roundSystemBlockRoute(wire.route, [], [], wire.trims),
      ),
    )
  const shapes = wires.map(shape)
  const fixedShapes = fixed.map(segmentsOf)
  for (let sweep = 0; sweep < 8; sweep++) {
    let changed = false
    for (const [wireIndex, wire] of wires.entries()) {
      for (let index = 1; index < wire.route.length - 1; index++) {
        const limit = wire.trims[index]
        if (limit === 0) continue
        const corner = wire.route[index]
        const reach = limit + WIRE_CLEARANCE
        const nearby = [
          ...shapes.filter((_, other) => other !== wireIndex),
          ...fixedShapes,
        ]
          .flat()
          .filter(
            ([a, b]) =>
              Math.min(a.x, b.x) < corner.x + reach &&
              Math.max(a.x, b.x) > corner.x - reach &&
              Math.min(a.y, b.y) < corner.y + reach &&
              Math.max(a.y, b.y) > corner.y - reach,
          )
        if (!nearby.length) continue
        const crowds = (trim: number) => {
          const limits = [0, trim, 0]
          const local = wire.route.slice(index - 1, index + 2)
          const arc = segmentsOf(
            sampleSystemBlockRoute(
              roundSystemBlockRoute(local, [], [], limits),
            ).slice(1, -1),
          )
          const sharp = segmentsOf([arc[0][0], corner, arc.at(-1)![1]])
          return nearby.some((other) => {
            const gap = (pieces: Segment[]) =>
              Math.min(...pieces.map((piece) => segmentDistance(piece, other)))
            return (
              gap(arc) < Math.min(WIRE_CLEARANCE, gap(sharp)) - SAMPLING_SLACK
            )
          })
        }
        if (!crowds(limit)) continue
        let clear = 0
        let blocked = limit
        for (let step = 0; step < 10; step++) {
          const middle = (clear + blocked) / 2
          if (crowds(middle)) blocked = middle
          else clear = middle
        }
        wire.trims[index] = clear < 0.001 ? 0 : clear
        shapes[wireIndex] = shape(wire)
        changed = true
      }
    }
    if (!changed) break
  }
}
