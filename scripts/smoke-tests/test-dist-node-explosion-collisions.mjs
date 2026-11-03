import { strict as assert } from "node:assert"
import { readFile } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { getManifoldModuleSync } from "@tscircuit/manifold-2d"
import { checkCircuitJsonAssemblyExplosionCollisions } from "../../dist/index.js"

assert.equal(getManifoldModuleSync(), null)
await checkCircuitJsonAssemblyExplosionCollisions([])
assert.equal(getManifoldModuleSync(), null)

// Use the same pinned real assembly/model bytes as the Bun smoke test, while
// exercising Node's native ESM import rules and the published entry point.
const readFixture = async (filename) =>
  JSON.parse(
    gunzipSync(
      await readFile(
        new URL(
          `../../tests/assembly/fixtures/rp2040-explosion/${filename}`,
          import.meta.url,
        ),
      ),
    ).toString(),
  )
const circuitJson = await readFixture("assembled.circuit.json.gz")
const assets = await readFixture("models.json.gz")
for (const record of circuitJson) {
  if (record.type !== "cad_component") continue
  for (const field of ["model_obj_url", "model_glb_url"]) {
    if (!record[field]?.startsWith("https://")) continue
    const asset = assets[record[field]]
    assert.ok(asset, "Missing pinned RP2040 model")
    record[field] = `data:${asset.mimeType};base64,${asset.base64}`
  }
}
const result = await checkCircuitJsonAssemblyExplosionCollisions(circuitJson)
assert.equal(result.status, "incomplete")
assert.equal(result.errors.length, 4)
assert.equal(
  result.warnings.flatMap((warning) => warning.cad_component_ids).length,
  5,
)
for (const collision of result.errors)
  assert.ok(
    Math.abs(collision.swept_intersection_volume_mm3 - 0.33685499871220387) <
      1e-6,
  )
assert.ok(getManifoldModuleSync())
console.log(
  "Node ESM package checks the real RP2040 assembly without manifold-3d",
)
