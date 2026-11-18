import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"
import { getFixedCopperHandoffSnapshot } from "tests/fixtures/fixed-copper-handoff/snapshot"
import provenance from "tests/fixtures/fixed-copper-handoff/native-h3.provenance.json"

test("native H3 earlier copper becomes 1040 proxies before the remaining solver", async () => {
  const compressed = readFileSync(new URL("../../fixtures/fixed-copper-handoff/native-h3.srj.json.gz", import.meta.url))
  const decoded = gunzipSync(compressed)
  expect(createHash("sha256").update(compressed).digest("hex")).toBe(provenance.fixtureGzipSha256)
  expect(createHash("sha256").update(decoded).digest("hex")).toBe(provenance.fixtureDecodedSha256)
  const before: SimpleRouteJson = JSON.parse(decoded.toString())
  const original = structuredClone(before)
  expect(before.obstacles).toHaveLength(445)
  expect(before.traces).toHaveLength(16)
  expect(before.traces?.flatMap((trace) => trace.route.filter((point) => point.route_type === "via"))).toHaveLength(22)
  const fixedIds = new Set(before.traces?.map((trace) => trace.pcb_trace_id))
  const input = withFixedTraces(before, fixedIds)
  expect(createHash("sha256").update(JSON.stringify(input)).digest("hex")).toBe(provenance.actualFlattenedSrjJsonSha256)
  expect(input.traces).toEqual([])
  expect(input.obstacles).toHaveLength(1485)
  expect(before).toEqual(original)
  await expect(getFixedCopperHandoffSnapshot([
    { title: "Native H3: accepted earlier physical copper", description: "16 traces, 22 vias, 445 native pads; original coordinates and rules.", input: before },
    { title: "Actual remaining-solver representation", description: "16 traces lost; 1040 proxy obstacles added. Representation replay only.", input },
  ])).toMatchSvgSnapshot(import.meta.path)
})
