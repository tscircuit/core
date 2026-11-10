import * as Flatten from "@flatten-js/core"
import type { PcbCutoutPolygon, PcbCutoutRect, Point } from "circuit-json"
import { compose, rotateDEG, translate } from "transformation-matrix"

/** Cutout-local rectangle to circuit-world positions (mm, +X right/+Y up,
 * right-handed +Z above). Polygon cutouts are already in circuit-world XY. */
function getRoutingSlotPolygon(
  cutout: PcbCutoutRect | PcbCutoutPolygon,
): Flatten.Polygon {
  if (cutout.shape === "polygon") {
    const polygon = new Flatten.Polygon(
      cutout.points.map(({ x, y }) => Flatten.point(x, y)),
    )
    return polygon.orientation() === Flatten.ORIENTATION.CW
      ? polygon.reverse()
      : polygon
  }
  const halfWidth = cutout.width / 2
  const halfHeight = cutout.height / 2
  const radius = Math.min(cutout.corner_radius ?? 0, halfWidth, halfHeight)
  let polygon: Flatten.Polygon
  if (radius <= 0) {
    polygon = new Flatten.Polygon(
      new Flatten.Box(-halfWidth, -halfHeight, halfWidth, halfHeight),
    )
  } else {
    const arcs = [
      Flatten.point(halfWidth - radius, halfHeight - radius),
      Flatten.point(-halfWidth + radius, halfHeight - radius),
      Flatten.point(-halfWidth + radius, -halfHeight + radius),
      Flatten.point(halfWidth - radius, -halfHeight + radius),
    ].map(
      (center, cornerIndex) =>
        new Flatten.Arc(
          center,
          radius,
          (cornerIndex * Math.PI) / 2,
          ((cornerIndex + 1) * Math.PI) / 2,
          true,
        ),
    )
    polygon = new Flatten.Polygon(
      arcs.flatMap((arc, cornerIndex) => {
        const nextArc = arcs[(cornerIndex + 1) % arcs.length]!
        return arc.end.equalTo(nextArc.start)
          ? [arc]
          : [arc, Flatten.segment(arc.end, nextArc.start)]
      }),
    )
  }
  // Cutout.doInitialPcbPrimitiveRender (primitive-components/Cutout.ts) emits
  // a counterclockwise world rotation and a world center for rectangle cutouts.
  const cutoutLocalToCircuitWorldTransform = compose(
    translate(cutout.center.x, cutout.center.y),
    rotateDEG(cutout.rotation ?? 0),
  )
  return polygon.transform(
    new Flatten.Matrix(
      cutoutLocalToCircuitWorldTransform.a,
      cutoutLocalToCircuitWorldTransform.b,
      cutoutLocalToCircuitWorldTransform.c,
      cutoutLocalToCircuitWorldTransform.d,
      cutoutLocalToCircuitWorldTransform.e,
      cutoutLocalToCircuitWorldTransform.f,
    ),
  )
}

/** Split circuit-world XY regions without changing their removed material;
 * all vertices are positions in mm (+X right, +Y up, right-handed +Z above). */
function getSlotPolygonsWithoutHoles(
  polygon: Flatten.Polygon,
): Flatten.Polygon[] {
  const hole: Flatten.Face | undefined = [...polygon.faces].find(
    (face: Flatten.Face) => face.orientation() === Flatten.ORIENTATION.CW,
  )
  if (!hole) return polygon.splitToIslands()
  // Circuit JSON cutouts have one ring. Split through an enclosed bridge so
  // each resulting cutout can describe the same removed material with one ring.
  const bounds = polygon.box
  const splitX = hole.box.center.x
  return [
    new Flatten.Box(bounds.xmin - 1, bounds.ymin - 1, splitX, bounds.ymax + 1),
    new Flatten.Box(splitX, bounds.ymin - 1, bounds.xmax + 1, bounds.ymax + 1),
  ].flatMap((half) =>
    getSlotPolygonsWithoutHoles(
      Flatten.BooleanOperations.intersect(polygon, new Flatten.Polygon(half)),
    ),
  )
}

/** Preserve bridges against every board's slots. All vertices/centers are
 * right-handed circuit-world positions in mm: +X right, +Y up, +Z above. */
export function preservePanelTabBridges(
  cutouts: (PcbCutoutRect | PcbCutoutPolygon)[],
  tabBridges: Point[][],
): (PcbCutoutRect | PcbCutoutPolygon)[] {
  const bridges = tabBridges.map((vertices) => {
    const polygon = new Flatten.Polygon(
      vertices.map(({ x, y }) => Flatten.point(x, y)),
    )
    return polygon.orientation() === Flatten.ORIENTATION.CW
      ? polygon.reverse()
      : polygon
  })
  return cutouts.flatMap((cutout) => {
    let slot = getRoutingSlotPolygon(cutout)
    let changed = false
    for (const bridge of bridges) {
      if (slot.box.not_intersect(bridge.box)) continue
      if (Flatten.BooleanOperations.intersect(slot, bridge).area() < 1e-8)
        continue
      slot = Flatten.BooleanOperations.subtract(slot, bridge)
      changed = true
    }
    if (!changed) return [cutout]
    return getSlotPolygonsWithoutHoles(slot).map(
      (polygon): PcbCutoutPolygon => ({
        type: "pcb_cutout",
        pcb_cutout_id: cutout.pcb_cutout_id,
        shape: "polygon",
        points: [...polygon.faces].flatMap((face: Flatten.Face) =>
          face.shapes.flatMap((shape) => {
            if (shape instanceof Flatten.Segment)
              return [{ x: shape.start.x, y: shape.start.y }]
            // Tessellate surviving rounded caps with at most 0.001 mm chord error.
            const maxAngle = 2 * Math.acos(1 - Math.min(0.001 / shape.r, 1))
            const steps = Math.max(1, Math.ceil(shape.sweep / maxAngle))
            return Array.from({ length: steps }, (_, arcIndex) => {
              const position = shape.pointAtLength(
                (shape.length * arcIndex) / steps,
              )!
              return { x: position.x, y: position.y }
            })
          }),
        ),
      }),
    )
  })
}
