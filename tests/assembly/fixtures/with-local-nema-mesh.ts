import type { AnyCircuitElement } from "circuit-json"
import { parseModelStringParams } from "@tscircuit/modelprinter"

const nemaFixtures = {
  nema8: "nema8.glb.gz",
  nema17: "nema17-wireangle0.glb",
  nema17_jstph6: "nema17-jstph6.glb.gz",
  nema23: "nema23.glb.gz",
  nema17_wireangle90deg: "nema17-wireangle90.glb",
  "nema17_bodylength48mm_shaftlength30mm_flatdepth0.5mm_flatlength18mm_plainbackface":
    "nema17-custom-plain-backface.glb.gz",
} as const

/** Replace motor assets only, preserving emitted circuit-world placement in mm
 * (+X right, +Y top, +Z above). Fixtures are right-handed motor-local +Z shaft.
 */
export const withLocalNemaMesh = async (circuitJson: AnyCircuitElement[]) =>
  Promise.all(
    circuitJson.map(async (element) => {
      if (
        element.type !== "cad_component" ||
        !element.model_glb_url?.startsWith(
          "https://modelcdn.tscircuit.com/jscad_models/nema",
        )
      )
        return element
      const model = decodeURIComponent(
        new URL(element.model_glb_url).pathname.split("/").at(-1)!,
      ).replace(/\.glb$/, "")
      const normalizedModel = parseModelStringParams(model).string
      const filename =
        nemaFixtures[normalizedModel as keyof typeof nemaFixtures]
      if (!filename) throw new Error(`No pinned mesh for NEMA model "${model}"`)
      const data = new Uint8Array(
        await Bun.file(new URL(filename, import.meta.url)).arrayBuffer(),
      )
      const mesh = filename.endsWith(".gz") ? Bun.gunzipSync(data) : data
      return {
        ...element,
        model_glb_url: `data:model/gltf-binary;base64,${Buffer.from(mesh).toString("base64")}`,
      }
    }),
  )
