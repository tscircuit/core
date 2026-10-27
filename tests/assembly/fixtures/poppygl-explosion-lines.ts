import type { AssemblyExplosionView } from "lib"
import type { ExplosionLine } from "poppygl"

/** Boundary paired with circuit-json-to-gltf's CAD center mapping followed by
 * GltfBuilder.toGltfTranslation: [-center.x, center.y, center.z]. Together these
 * map circuit-world [x,y,z] to scene [-x,z,y], mm, right-handed +Y up.
 * Points pick up the complete exporter mapping, not just its intermediate box
 * center. This matches emitted glTF geometry, without a renderer compensation.
 */
export const poppyglExplosionLines = (
  view: AssemblyExplosionView,
): ExplosionLine[] =>
  view.lines.map((line) => ({
    points: line.points.map((point) => [-point.x, point.z, point.y] as const),
  }))
