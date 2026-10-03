import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import type { AnyCircuitElement } from "circuit-json"
import {
  computeWorldAABB,
  createSceneFromGLTF,
  loadGLTFWithResourcesFromURL,
} from "poppygl"

/** Bounds measured from the emitted GLB in renderer space, mm: scene (-X,+Z,+Y) relative to
 * circuit world (+X right,+Y top,+Z above). No restatement of core's Euler transform.
 */
export const getRenderedMotorBounds = async (
  circuitJson: AnyCircuitElement[],
) => {
  const glb = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    includeModels: true,
  })
  const { gltf, resources } = await loadGLTFWithResourcesFromURL(
    `data:model/gltf-binary;base64,${Buffer.from(glb as Uint8Array).toString("base64")}`,
  )
  const scene = createSceneFromGLTF(gltf, resources)
  if (!scene.drawCalls.length)
    throw new Error("Motor GLB contains no rendered geometry")
  return computeWorldAABB(scene.drawCalls)
}
