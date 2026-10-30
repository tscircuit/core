import type { AnyCircuitElement } from "circuit-json"

/** Pinned TSX export, with identical geometry/IDs and local copies of model bytes.
 * Circuit-world positions are right-handed XYZ in mm, +X right, +Y top, +Z above.
 */
export async function loadRp2040ExplosionFixture(): Promise<
  AnyCircuitElement[]
> {
  const readGzipJson = async (filename: string) =>
    JSON.parse(
      new TextDecoder().decode(
        Bun.gunzipSync(
          new Uint8Array(
            await Bun.file(new URL(filename, import.meta.url)).arrayBuffer(),
          ),
        ),
      ),
    )
  const json: AnyCircuitElement[] = await readGzipJson(
    "assembled.circuit.json.gz",
  )
  const assets: Record<string, { mimeType: string; base64: string }> =
    await readGzipJson("models.json.gz")
  return json.map((record) => {
    if (record.type !== "cad_component") return record
    const local = { ...record }
    for (const field of ["model_obj_url", "model_glb_url"] as const) {
      const url = local[field]
      if (!url?.startsWith("https://")) continue
      const asset = assets[url]
      if (!asset)
        throw new Error(
          "Missing pinned RP2040 model; regenerate the snapshot fixture",
        )
      local[field] = `data:${asset.mimeType};base64,${asset.base64}`
    }
    return local
  })
}
