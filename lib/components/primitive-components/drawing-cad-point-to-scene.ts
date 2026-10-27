import type { CadComponent } from "circuit-json"
import { mat4, vec3 } from "gl-matrix"

/** CAD model-local point -> glTF scene-world point, mm, right-handed +Y up.
 * Paired with circuit-json-to-gltf CIRCUIT_Z_UP_TO_SCENE_Y_UP, transformMesh,
 * and convertMeshToGLTFOrientation: scene rotations Y,Z,X become CAD Rx*Ry*Rz;
 * the final coordinate exchange maps CAD (x,y,z) to (-x,z,y).
 * Native feature ancestry must be applied before calling this boundary.
 */
export function drawingCadPointToScene(cad: CadComponent, point: vec3): vec3 {
  const placement = mat4.create()
  mat4.translate(placement, placement, [
    cad.position.x,
    cad.position.y,
    cad.position.z,
  ])
  for (const [rotate, angle] of [
    [mat4.rotateX, cad.rotation?.x ?? 0],
    [mat4.rotateY, cad.rotation?.y ?? 0],
    [mat4.rotateZ, cad.rotation?.z ?? 0],
  ] as const)
    rotate(placement, placement, (angle * Math.PI) / 180)
  const scale = cad.model_unit_to_mm_scale_factor ?? 1
  mat4.scale(placement, placement, [scale, scale, scale])
  const transformed = vec3.transformMat4([0, 0, 0], point, placement)
  return [-transformed[0], transformed[2], transformed[1]]
}
