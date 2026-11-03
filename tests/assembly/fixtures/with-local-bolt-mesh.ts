import type { AnyCircuitElement } from "circuit-json"

const meshes = {
  hexsocketbolt: "m3-socket-head.glb.gz",
  hexbolt: "hexbolt-m3.glb.gz",
  panscrew: "panscrew-m3.glb.gz",
  flatheadscrew: "flatheadscrew-m3.glb.gz",
} as const

/** Same M3 x 10 JSCAD Electronics envelope and seating origin, in local mm
 * (+Z head, -Z shaft). Fixtures omit thread tessellation; placements and
 * canonical modelcdn URLs are asserted before asset substitution.
 */
export const withLocalBoltMesh = async (json: AnyCircuitElement[]) =>
  Promise.all(
    json.map(async (element) => {
      if (element.type !== "cad_component") return element
      const fn = element.model_glb_url?.match(
        /\/(hexsocketbolt|hexbolt|panscrew|flatheadscrew)_m3_l10mm(?:_threadpitch0.5mm)?(?:_nothreads)?\.glb$/,
      )?.[1]
      if (!fn) return element
      const bytes = new Uint8Array(
        await Bun.file(
          new URL(meshes[fn as keyof typeof meshes], import.meta.url),
        ).arrayBuffer(),
      )
      return {
        ...element,
        model_glb_url: `data:model/gltf-binary;base64,${Buffer.from(Bun.gunzipSync(bytes)).toString("base64")}`,
      }
    }),
  )
