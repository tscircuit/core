import type { AnyCircuitElement } from "circuit-json"

/** Substitute checked-in JSCAD GLBs at the asset boundary, leaving core's
 * emitted world-space placement and rotation untouched. This keeps tests
 * independent of modelcdn's deployed version. Geometry is in motor-local mm,
 * right-handed +Z shaft, +X default wireside, front face at the origin.
 */
export const withLocalNemaMesh = async (
  circuitJson: AnyCircuitElement[],
  wireAngle: 0 | 90 = 0,
) => {
  const mesh = await Bun.file(
    new URL(`./nema17-wireangle${wireAngle}.glb`, import.meta.url),
  ).arrayBuffer()
  const modelUrl = `data:model/gltf-binary;base64,${Buffer.from(mesh).toString("base64")}`
  return circuitJson.map((element) =>
    element.type === "cad_component"
      ? { ...element, model_glb_url: modelUrl }
      : element,
  )
}
