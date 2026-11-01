import type { AnyCircuitElement, CadComponent } from "circuit-json"
import { mat4 } from "gl-matrix"
import { jscadToManifold } from "jscad-to-manifold"
import type { Manifold, ManifoldToplevel, Mat4 } from "manifold-3d"
import { getCadModelMatrix } from "lib/utils/assembly-drawing/geometry/get-drawing-draw-calls"

/** Convert JSCAD model-local points to a solid in right-handed circuit world
 * (+X right, +Y top, +Z above), mm. Reuse the drawing model placement matrix,
 * which is measured against emitted glTF geometry, then undo only its documented
 * CAD_TO_GLTF basis change: glTF (-x,z,y) -> circuit (x,y,z).
 * Origin, units, object fit, rotation and bottom placement stay in that shared
 * placement path. The caller owns the returned WASM solid.
 */
export function createCadCollisionSolid(
  cad: CadComponent,
  circuitJson: AnyCircuitElement[],
  manifold: ManifoldToplevel,
): Manifold {
  const local = jscadToManifold(cad.model_jscad, { manifold })
  try {
    const positions = local.getMesh().vertProperties
    const gltfToCircuit = mat4.fromValues(
      -1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
    )
    const world = mat4.multiply(
      mat4.create(),
      gltfToCircuit,
      getCadModelMatrix(cad, positions, circuitJson),
    )
    const placed = local.transform(Array.from(world) as Mat4)
    if (placed.status() !== "NoError" || placed.isEmpty()) {
      placed.delete()
      throw new Error("CAD model does not define a valid closed solid")
    }
    return placed
  } finally {
    local.delete()
  }
}
