import { mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import type { AnyCircuitElement } from "circuit-json"

// Input: the unmodified export of the pinned real board + assembly TSX.
// Reproduction and attribution: tests/assembly/fixtures/rp2040-explosion/README.md.
const inputPath = process.argv[2]
if (!inputPath) throw new Error("Pass the assembled.circuit.json export path")
const directory = new URL(
  "../tests/assembly/fixtures/rp2040-explosion/",
  import.meta.url,
)
await mkdir(directory, { recursive: true })
const json = JSON.parse(await Bun.file(inputPath).text()) as AnyCircuitElement[]
const assets: Record<string, { mimeType: string; base64: string }> = {}
const urls = new Map<string, string>()
for (const cad of json) {
  if (cad.type !== "cad_component") continue
  // OBJ takes precedence over STEP in the exporter. Footprinter models are
  // generated locally; data URLs and JSCAD plans are already self-contained.
  const url = cad.model_obj_url ?? cad.model_glb_url
  if (url?.startsWith("https://"))
    urls.set(url, cad.model_obj_url ? "text/plain" : "model/gltf-binary")
}
const pending = [...urls.entries()]
const manifest: { url: string; bytes: number; sha256: string }[] = []
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (;;) {
      const next = pending.shift()
      if (!next) return
      const [url, mimeType] = next
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`Model download failed: ${response.status} ${url}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      assets[url] = { mimeType, base64: bytes.toString("base64") }
      manifest.push({
        url,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      })
    }
  }),
)
const source = JSON.stringify(json)
const orderedAssets = Object.fromEntries(
  Object.entries(assets).sort(([a], [b]) => a.localeCompare(b)),
)
await Bun.write(
  new URL("assembled.circuit.json.gz", directory),
  Bun.gzipSync(source),
)
await Bun.write(
  new URL("models.json.gz", directory),
  Bun.gzipSync(JSON.stringify(orderedAssets)),
)
await Bun.write(
  new URL("manifest.json", directory),
  JSON.stringify(
    {
      records: json.length,
      circuitJsonSha256: createHash("sha256").update(source).digest("hex"),
      models: manifest.sort((a, b) => a.url.localeCompare(b.url)),
    },
    null,
    2,
  ) + "\n",
)
console.log(`Pinned ${json.length} records and ${manifest.length} model assets`)
