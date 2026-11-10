import {
  createSceneFromGLTF,
  encodePNG,
  loadGLTFWithResourcesFromURL,
  renderSceneFromGLTF,
  type RenderOptionsInput,
} from "poppygl"
import type {
  AssemblyExplosionCollisionCheck,
  ExplosionCadId,
} from "lib/assembly-explosion/collision/types"

/** Review-only appearance overlay on the real exported assembly. Select moving
 * parts by IDs from actual collision diagnostics and glTF identity extras. Only
 * materials change; all geometry, stage placement and embedded guides stay in
 * the exporter's glTF world frame (+Y up, right-handed, millimetres).
 */
export async function renderCollisionAssembly(
  glb: Uint8Array,
  check: AssemblyExplosionCollisionCheck,
  options: RenderOptionsInput,
) {
  const { gltf, resources } = await loadGLTFWithResourcesFromURL(
    `data:model/gltf-binary;base64,${Buffer.from(glb).toString("base64")}`,
  )
  const collidingCadIds = new Set(
    check.errors.map((error) => error.moving_cad_component_id),
  )
  const highlightedCadIds = new Set<ExplosionCadId>()
  for (const node of gltf.nodes ?? []) {
    const cadId = node.extras?.tscircuit?.cad_component_id
    if (!collidingCadIds.has(cadId) || node.mesh === undefined) continue
    highlightedCadIds.add(cadId)
    // A mesh/material may be shared by several CAD parts. Give the diagnosed
    // part its own material bindings so unrelated instances keep their colors.
    const mesh = structuredClone(gltf.meshes[node.mesh])
    for (const primitive of mesh.primitives) {
      const material = {
        ...gltf.materials[primitive.material],
        pbrMetallicRoughness: {
          baseColorFactor: [1, 0.08, 0.04, 0.48],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
        emissiveFactor: [0.25, 0, 0],
        alphaMode: "BLEND",
        doubleSided: true,
      }
      // The diagnostic tint must not be multiplied by the model's blue color.
      delete primitive.attributes.COLOR_0
      primitive.material = gltf.materials.push(material) - 1
    }
    node.mesh = gltf.meshes.push(mesh) - 1
  }
  if (highlightedCadIds.size !== collidingCadIds.size)
    throw new Error(
      "A diagnosed collision part was missing from the exported visual",
    )
  const scene = createSceneFromGLTF(gltf, resources)
  return encodePNG(renderSceneFromGLTF(scene, options).bitmap)
}
