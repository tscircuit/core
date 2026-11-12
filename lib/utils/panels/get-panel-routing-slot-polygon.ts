import * as Flatten from "@flatten-js/core"
import type { PcbCutoutPolygon, PcbCutoutRect } from "circuit-json"
import { compose, rotateDEG, translate } from "transformation-matrix"

/** Cutout-local rectangle to circuit-world positions (mm, +X right/+Y up,
 * right-handed +Z above). Polygon cutouts are already in circuit-world XY. */
export function getPanelRoutingSlotPolygon(
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
