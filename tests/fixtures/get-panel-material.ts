import { getManifoldModule, type CrossSection } from "@tscircuit/manifold-2d"
import type { PcbCutout, PcbHole, PcbPanel } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

/** Remaining substrate in right-handed circuit-world XY, mm: +X right,
 * +Y up, +Z above. All centers and polygon vertices are positions. */
export async function getPanelMaterial(
  panel: PcbPanel,
  cutouts: PcbCutout[],
  holes: PcbHole[],
): Promise<CrossSection> {
  const { CrossSection } = await getManifoldModule()
  const cuts = cutouts.map((cutout) => {
    if (cutout.shape === "polygon") {
      return CrossSection.ofPolygons([
        cutout.points.map(({ x, y }) => [x, y] as [number, number]),
      ])
    }
    if (cutout.shape === "circle") {
      return CrossSection.circle(cutout.radius, 96).translate(
        cutout.center.x,
        cutout.center.y,
      )
    }
    if (cutout.shape !== "rect") {
      throw new Error("Panel material fixture does not support path cutouts")
    }
    const halfWidth = cutout.width / 2
    const halfHeight = cutout.height / 2
    const radius = Math.min(cutout.corner_radius ?? 0, halfWidth, halfHeight)
    const transform = compose(
      translate(cutout.center.x, cutout.center.y),
      rotateDEG(cutout.rotation ?? 0),
    )
    const corners = [
      [halfWidth - radius, halfHeight - radius],
      [-halfWidth + radius, halfHeight - radius],
      [-halfWidth + radius, -halfHeight + radius],
      [halfWidth - radius, -halfHeight + radius],
    ]
    const points = corners.flatMap(([x, y], cornerIndex) =>
      Array.from({ length: 25 }, (_, arcIndex) => {
        const angle = (cornerIndex + arcIndex / 24) * (Math.PI / 2)
        const position = applyToPoint(transform, {
          x: x! + radius * Math.cos(angle),
          y: y! + radius * Math.sin(angle),
        })
        return [position.x, position.y] as [number, number]
      }),
    )
    return CrossSection.ofPolygons([points])
  })
  for (const hole of holes) {
    if (hole.hole_shape !== "circle") {
      throw new Error("Panel material fixture only supports circular drills")
    }
    cuts.push(
      CrossSection.circle(hole.hole_diameter / 2, 96).translate(hole.x, hole.y),
    )
  }
  const blank = CrossSection.square(
    [panel.width, panel.height],
    true,
  ).translate(panel.center.x, panel.center.y)
  const routed = CrossSection.union(cuts)
  const material = blank.subtract(routed)
  blank.delete()
  routed.delete()
  for (const cut of cuts) cut.delete()
  return material
}
