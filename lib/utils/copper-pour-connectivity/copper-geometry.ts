import {
  Arc,
  Box,
  Circle,
  Matrix,
  ORIENTATION,
  Point,
  Polygon,
  Segment,
} from "@flatten-js/core"
import type {
  PcbCopperPour,
  PcbPlatedHole,
  PcbSmtPad,
  Point as CircuitPoint,
  Ring,
} from "circuit-json"
import { compose, rotate, translate } from "transformation-matrix"

/** All geometry here is PCB world space in mm: +X right, +Y up, right-handed.
 * Arguments are points (translation applies); rotations are CCW about +Z.
 * Curves remain analytic arcs, so small contacts do not depend on tessellation.
 */
export const placePolygon = (
  polygon: Polygon,
  center: CircuitPoint,
  degrees = 0,
) => {
  const { a, b, c, d, e, f } = compose(
    translate(center.x, center.y),
    rotate((degrees * Math.PI) / 180),
  )
  return polygon.transform(new Matrix(a, b, c, d, e, f))
}

const ccw = (polygon: Polygon) =>
  polygon.orientation() === ORIENTATION.CCW ? polygon : polygon.reverse()

export const circlePolygon = (center: CircuitPoint, radius: number) =>
  ccw(new Polygon(new Circle(new Point(center.x, center.y), radius)))

export const roundedRectangle = (
  center: CircuitPoint,
  width: number,
  height: number,
  radius = 0,
  degrees = 0,
) => {
  const x = width / 2
  const y = height / 2
  const r = Math.max(0, Math.min(radius, x, y))
  if (r === 0)
    return placePolygon(
      ccw(new Polygon(new Box(-x, -y, x, y))),
      center,
      degrees,
    )
  const arcs = [
    new Arc(new Point(x - r, -y + r), r, -Math.PI / 2, 0, true),
    new Arc(new Point(x - r, y - r), r, 0, Math.PI / 2, true),
    new Arc(new Point(-x + r, y - r), r, Math.PI / 2, Math.PI, true),
    new Arc(new Point(-x + r, -y + r), r, Math.PI, Math.PI * 1.5, true),
  ]
  const edges: Array<Arc | Segment> = []
  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i]!
    const next = arcs[(i + 1) % arcs.length]!
    edges.push(arc)
    if (arc.end.distanceTo(next.start)[0] > 1e-12)
      edges.push(new Segment(arc.end, next.start))
  }
  return placePolygon(ccw(new Polygon(edges)), center, degrees)
}

/** Converts a BRep ring in board-world mm, including signed bulge arcs. */
const ringPolygon = (ring: Ring) => {
  const edges: Array<Arc | Segment> = []
  for (let i = 0; i < ring.vertices.length; i++) {
    const start = ring.vertices[i]!
    const end = ring.vertices[(i + 1) % ring.vertices.length]!
    const dx = end.x - start.x
    const dy = end.y - start.y
    if (dx === 0 && dy === 0) continue
    const bulge = start.bulge ?? 0
    if (bulge === 0) {
      edges.push(
        new Segment(new Point(start.x, start.y), new Point(end.x, end.y)),
      )
    } else {
      const offset = (1 - bulge * bulge) / (4 * bulge)
      const center = new Point(
        (start.x + end.x) / 2 - dy * offset,
        (start.y + end.y) / 2 + dx * offset,
      )
      edges.push(
        new Arc(
          center,
          (Math.hypot(dx, dy) * (1 + bulge * bulge)) / (4 * Math.abs(bulge)),
          Math.atan2(start.y - center.y, start.x - center.x),
          Math.atan2(end.y - center.y, end.x - center.x),
          bulge > 0,
        ),
      )
    }
  }
  return ccw(new Polygon(edges))
}

const subtractHole = (outer: Polygon, hole: Polygon) => {
  for (const face of hole.reverse().faces) outer.addFace(face.shapes)
  return outer
}

export const getPourPolygon = (pour: PcbCopperPour): Polygon => {
  if (pour.shape === "rect")
    return roundedRectangle(
      pour.center,
      pour.width,
      pour.height,
      0,
      pour.rotation,
    )
  if (pour.shape === "polygon")
    return ccw(new Polygon(pour.points.map((p) => new Point(p.x, p.y))))
  const polygon = ringPolygon(pour.brep_shape.outer_ring)
  for (const ring of pour.brep_shape.inner_rings)
    subtractHole(polygon, ringPolygon(ring))
  return polygon
}

export const getSmtPadPolygon = (pad: PcbSmtPad): Polygon => {
  if (pad.shape === "polygon")
    return ccw(new Polygon(pad.points.map((p) => new Point(p.x, p.y))))
  if (pad.shape === "circle") return circlePolygon(pad, pad.radius)
  const radius =
    pad.shape === "pill" || pad.shape === "rotated_pill"
      ? pad.radius
      : (pad.corner_radius ?? pad.rect_border_radius ?? 0)
  return roundedRectangle(
    pad,
    pad.width,
    pad.height,
    radius,
    "ccw_rotation" in pad ? pad.ccw_rotation : 0,
  )
}

export const getViaPolygon = (
  center: CircuitPoint,
  outerDiameter: number,
  holeDiameter: number,
) =>
  subtractHole(
    circlePolygon(center, outerDiameter / 2),
    circlePolygon(center, holeDiameter / 2),
  )

/** Polygon plated-hole outlines are footprint-local offsets; all other pad
 * outlines and hole offsets use the emitted board-world dimensions/rotations.
 * The polygon placement matches PlatedHole.doInitialPcbComponentRender's local
 * pad_outline convention, with the owning component's rotation when omitted.
 */
export const getPlatedHolePolygon = (
  pad: PcbPlatedHole,
  componentRotation = 0,
): Polygon => {
  if (pad.shape === "circle")
    return getViaPolygon(pad, pad.outer_diameter, pad.hole_diameter)
  if ("outer_width" in pad) {
    return subtractHole(
      roundedRectangle(
        pad,
        pad.outer_width,
        pad.outer_height,
        Math.min(pad.outer_width, pad.outer_height) / 2,
        pad.ccw_rotation,
      ),
      roundedRectangle(
        pad,
        pad.hole_width,
        pad.hole_height,
        Math.min(pad.hole_width, pad.hole_height) / 2,
        pad.ccw_rotation,
      ),
    )
  }
  const center = { x: pad.x + pad.hole_offset_x, y: pad.y + pad.hole_offset_y }
  const outer =
    pad.shape === "hole_with_polygon_pad"
      ? placePolygon(
          ccw(new Polygon(pad.pad_outline.map((p) => new Point(p.x, p.y)))),
          pad,
          pad.ccw_rotation ?? componentRotation,
        )
      : roundedRectangle(
          pad,
          pad.rect_pad_width,
          pad.rect_pad_height,
          pad.rect_border_radius,
          "rect_ccw_rotation" in pad ? pad.rect_ccw_rotation : 0,
        )
  if (
    pad.shape === "circular_hole_with_rect_pad" ||
    (pad.shape === "hole_with_polygon_pad" && pad.hole_shape === "circle")
  ) {
    if (pad.hole_diameter === undefined)
      throw new Error("Circular plated hole requires hole_diameter")
    return subtractHole(outer, circlePolygon(center, pad.hole_diameter / 2))
  }
  if (
    !("hole_width" in pad) ||
    pad.hole_width === undefined ||
    pad.hole_height === undefined
  )
    throw new Error("Slotted plated hole requires hole_width and hole_height")
  return subtractHole(
    outer,
    roundedRectangle(
      center,
      pad.hole_width,
      pad.hole_height,
      Math.min(pad.hole_width, pad.hole_height) / 2,
      "hole_ccw_rotation" in pad
        ? pad.hole_ccw_rotation
        : pad.shape === "hole_with_polygon_pad"
          ? (pad.ccw_rotation ?? componentRotation)
          : 0,
    ),
  )
}

/** Copper for a straight trace segment in world mm, with round end caps.
 * Interpolated traces are the convex hull of their endpoint disks.
 */
export const getTraceSegmentPolygon = (
  start: CircuitPoint,
  end: CircuitPoint,
  startWidth: number,
  endWidth = startWidth,
): Polygon => {
  const length = Math.hypot(end.x - start.x, end.y - start.y)
  const r1 = startWidth / 2
  const r2 = endWidth / 2
  if (length <= Math.abs(r2 - r1))
    return circlePolygon(r1 >= r2 ? start : end, Math.max(r1, r2))
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const tangent = Math.acos((r1 - r2) / length)
  const first = new Arc(
    new Point(start.x, start.y),
    r1,
    angle + tangent,
    angle - tangent,
    true,
  )
  const second = new Arc(
    new Point(end.x, end.y),
    r2,
    angle - tangent,
    angle + tangent,
    true,
  )
  return ccw(
    new Polygon([
      first,
      new Segment(first.end, second.start),
      second,
      new Segment(second.end, first.start),
    ]),
  )
}

/** Same-layer contact in board-world mm. Holes are excluded from containment.
 * 1e-7 mm is numerical tolerance, not an electrical/manufacturing clearance.
 */
export const copperPolygonsTouch = (a: Polygon, b: Polygon, tolerance = 1e-7) =>
  a.vertices.some((p) => b.contains(p)) ||
  b.vertices.some((p) => a.contains(p)) ||
  a.distanceTo(b)[0] <= tolerance
