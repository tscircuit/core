import { checkCircuitJsonAssemblyExplosionCollisions } from "../lib/assembly-explosion/check-circuit-json-assembly-explosion-collisions"
import { loadRp2040ExplosionFixture } from "../tests/assembly/fixtures/rp2040-explosion/load-fixture"

// Offline reproduction using the pinned real TSX export and original model bytes.
// Add --reverse-cover to drive the cover/bolts through the board instead of up.
const circuitJson = await loadRp2040ExplosionFixture()
if (process.argv.includes("--reverse-cover")) {
  const move = circuitJson.find(
    (record) => record.type === "cad_explosion_move",
  )!
  move.translation.z = -24
}
const started = performance.now()
const check = await checkCircuitJsonAssemblyExplosionCollisions(circuitJson)
const sources = new Map(
  circuitJson
    .filter((r) => r.type === "source_component")
    .map((r) => [r.source_component_id, r.name]),
)
const cad = circuitJson.filter((r) => r.type === "cad_component")
const names = new Map(
  cad.map((r) => [r.cad_component_id, sources.get(r.source_component_id)]),
)
const skipped = new Set(check.warnings.flatMap((w) => w.cad_component_ids))
console.log(
  JSON.stringify(
    {
      status: check.status,
      elapsedMs: Math.round(performance.now() - started),
      cadModels: {
        total: cad.length,
        checked: cad.length - skipped.size,
        unchecked: skipped.size,
      },
      warnings: check.warnings.map((w) => ({
        reason: w.reason,
        parts: w.cad_component_ids.map((id) => names.get(id)),
      })),
      collisions: check.errors.map((e) => ({
        message: e.message,
        sweptIntersectionVolumeMm3: e.swept_intersection_volume_mm3,
      })),
    },
    null,
    2,
  ),
)
