import { mat3, vec3 } from "gl-matrix"
import type { AssemblyPart } from "./AssemblyPart"
import type { AssemblyPrintedPart } from "./AssemblyPrintedPart"
import type { AssemblyReferenceSurface } from "./AssemblyReferenceSurface"
import { getPartReferenceSurfaces } from "./get-part-reference-surfaces"
import { resolvePrintedPartMounts } from "./resolve-printed-part-mounts"

/** Emit right-handed circuit-world frames: +X right, +Y top, +Z above, mm.
 * Origins are points; unit normal/X directions ignore translation. Use the
 * same finalized mounting transform as AssemblyPrintedPart's CAD geometry,
 * independent of model position offsets and whether a model exists.
 */
export const renderPartReferenceSurfaces = (
  part: AssemblyPart | AssemblyPrintedPart,
) => {
  const surfaces = getPartReferenceSurfaces(part)
  if (!surfaces.length) return
  const { transforms, subcircuitId } = resolvePrintedPartMounts(part)
  const world = transforms.get(part)!
  const rotation = mat3.fromMat4(mat3.create(), world)
  const toPoint = (vector: ArrayLike<number>) => ({
    x: vector[0],
    y: vector[1],
    z: vector[2],
  })
  for (const surface of surfaces) {
    const child = part.children.find(
      (child): child is AssemblyReferenceSurface =>
        child.componentName === "AssemblyReferenceSurface" &&
        child.name === surface.name,
    )
    part.root!.db.cad_reference_surface.insert({
      source_component_id: part.source_component_id!,
      name: surface.name,
      shape: "rect",
      center: toPoint(vec3.transformMat4(vec3.create(), surface.origin, world)),
      normal: toPoint(
        vec3.normalize(
          vec3.create(),
          vec3.transformMat3(vec3.create(), surface.normal, rotation),
        ),
      ),
      x_axis: toPoint(
        vec3.normalize(
          vec3.create(),
          vec3.transformMat3(vec3.create(), surface.xAxis, rotation),
        ),
      ),
      width: child?._parsedProps.width,
      height: child?._parsedProps.height,
      subcircuit_id: subcircuitId,
    })
  }
}
