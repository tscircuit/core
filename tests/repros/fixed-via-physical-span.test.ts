import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { gzipSync } from "node:zlib"
import { CIRCUIT_TO_SVG_VERSION } from "circuit-to-svg"
import "tests/fixtures/extend-expect-any-svg"
import {
  getFixedViaPhysicalSpanFixture,
  observeFixedViaPhysicalSpans,
} from "tests/fixtures/fixed-via-physical-span"
import { getFixedViaPhysicalSpanSnapshot } from "tests/fixtures/fixed-via-physical-span-snapshot"

test("reproduce loss of four-layer existing via spans at Core's bus handoff", async () => {
  const fixture = getFixedViaPhysicalSpanFixture()
  const original = structuredClone(fixture)
  const observed = observeFixedViaPhysicalSpans(fixture)
  expect(observed.rows.map((row) => row.exportedLayers)).toEqual([
    undefined,
    ["top", "inner1"],
    undefined,
    undefined,
  ])
  expect(
    observed.recovered.obstacles.filter(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
    ),
  ).toHaveLength(1)
  expect(fixture).toEqual(original)
  const svg = getFixedViaPhysicalSpanSnapshot({
    circuitJson: fixture.circuitJson,
    rows: observed.rows,
  })
  // Temporary canonical CI capture; remove after the verified SVG is saved.
  // Every physical-span, duplicate-obstacle and immutability assertion above
  // has passed. No rejected or unfinished solver candidate is being rendered.
  if (process.env.CI) {
    const bytes = Buffer.from(svg)
    const gzip = gzipSync(bytes)
    const base64 = gzip.toString("base64")
    expect(bytes.length).toBeLessThan(2 * 1024 * 1024)
    expect(base64.length).toBeLessThan(2 * 1024 * 1024)
    const chunks = base64.match(/.{1,180}/g) ?? []
    const sha256 = (bytes: Uint8Array) =>
      createHash("sha256").update(bytes).digest("hex")
    const metadata = {
      phase: "repro",
      bytes: bytes.length,
      sha256: sha256(bytes),
      gzipBytes: gzip.length,
      gzipSha256: sha256(gzip),
      chunks: chunks.length,
      rendererVersion: CIRCUIT_TO_SVG_VERSION,
      fixtureSha256: sha256(Buffer.from(JSON.stringify(fixture))),
      exportedSpans: observed.rows.map((row) => ({
        ...row,
        exportedLayers: row.exportedLayers ?? null,
      })),
      duplicateViaObstacleCount: observed.recovered.obstacles.filter(
        (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
      ).length,
    }
    console.log("CORE_VIA_SPAN_SVG_BEGIN " + JSON.stringify(metadata))
    for (const [index, chunk] of chunks.entries())
      console.log(`CORE_VIA_SPAN_SVG_CHUNK ${index} ${chunk}`)
    console.log("CORE_VIA_SPAN_SVG_END " + JSON.stringify(metadata))
  }
  await expect(svg).toMatchSvgSnapshot(
    import.meta.path,
    "fixed-via-physical-span",
    {
      diffThresholdPercent: 0,
    },
  )
})
