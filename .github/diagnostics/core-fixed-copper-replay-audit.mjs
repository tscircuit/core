import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import { gzipSync, gunzipSync } from "node:zlib"
import { execFileSync } from "node:child_process"

const sourceRoot = process.argv[2]
assert(sourceRoot, "Explicit immutable source checkout is required")
const root = resolve(sourceRoot)
const expectedCommit = "ce1d31cd9c089cf45034c2b156d1b9306c98bd44"
const commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()
assert.equal(commit, expectedCommit)
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex")
const gitBlob = (bytes) => createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex")
const sourceHashes = []
for (const [path, expectedBlob] of [
  ["lib/utils/autorouting/with-fixed-traces.ts", "471b39b5189ed3418a14c22636d3d80c65b98c78"],
  ["lib/utils/getViaSpanLayers.ts", "c362d20232f3bd32b9825b9e419d9e9f7b2a5fed"],
]) {
  const bytes = readFileSync(join(root, path))
  assert.equal(gitBlob(bytes), expectedBlob)
  sourceHashes.push({ path, bytes: bytes.length, sha256: hash(bytes), gitBlob: expectedBlob })
}
const compressed = readFileSync(join(root, "tests/fixtures/fixed-copper-handoff/native-h3.srj.json.gz"))
const decoded = gunzipSync(compressed)
assert.equal(hash(compressed), "28204b54e27e98ee490bb9b9c4949a9f03f2534325159633125460336c8cf28b")
assert.equal(hash(decoded), "11529b5670571c1f127106f0ca0e2baa4ef662f4f91c87b521a03aa4e7241862")
const before = JSON.parse(decoded.toString("utf8"))
const immutableBefore = JSON.stringify(before)
const { withFixedTraces } = await import(pathToFileURL(join(root, "lib/utils/autorouting/with-fixed-traces.ts")).href)
const ids = new Set(before.traces.map((trace) => trace.pcb_trace_id))
const flat = withFixedTraces(before, ids)
assert.equal(JSON.stringify(before), immutableBefore)
assert.deepEqual(withFixedTraces(before, ids), flat)
assert.equal(before.traces.length, 16)
assert.equal(before.obstacles.length, 445)
assert.equal(flat.traces.length, 0)
assert.equal(flat.obstacles.length, 1485)
const sortKeys = (value) => Array.isArray(value) ? value.map(sortKeys) :
  value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])])) : value
const diagonalMath = []
for (const trace of before.traces) {
  for (const [index, point] of trace.route.entries()) {
    const next = trace.route[index + 1]
    if (!next || !["wire", "via"].includes(point.route_type) || !["wire", "via"].includes(next.route_type)) continue
    const dx = next.x - point.x, dy = next.y - point.y
    if (dx === 0 || dy === 0) continue
    const width = point.route_type === "wire" ? point.width : next.route_type === "wire" ? next.width : before.minTraceWidth
    const hypot = Math.hypot(dx, dy)
    diagonalMath.push({ trace: trace.pcb_trace_id, index, dx, dy, width, hypot,
      steps: Math.max(1, Math.ceil(hypot / width)),
      projectedWidthX: Math.abs(dy) / hypot * width,
      projectedWidthY: Math.abs(dx) / hypot * width,
      sqrt1_2: Math.SQRT1_2 })
  }
}
const requireFromSource = createRequire(join(root, "package.json"))
const peers = []
for (const name of ["@tscircuit/bus-lanes-solver", "@tscircuit/capacity-autorouter", "@tscircuit/checks", "@tscircuit/props", "circuit-json"]) {
  const executable = requireFromSource.resolve(name)
  let directory = dirname(executable)
  let manifest
  while (true) {
    const candidate = join(directory, "package.json")
    if (existsSync(candidate)) {
      const parsed = JSON.parse(readFileSync(candidate, "utf8"))
      if (parsed.name === name) { manifest = candidate; break }
    }
    const parent = dirname(directory)
    assert.notEqual(parent, directory, "Actual peer manifest not found: " + name)
    directory = parent
  }
  const manifestBytes = readFileSync(manifest)
  const entryBytes = readFileSync(executable)
  peers.push({ name, version: JSON.parse(manifestBytes.toString()).version, manifest,
    manifestSha256: hash(manifestBytes), executable, executableSha256: hash(entryBytes), executableBytes: entryBytes.length })
}
const flatBytes = Buffer.from(JSON.stringify(flat))
const header = { schema: "core-fixed-copper-replay-diff/v1", sourceCommit: commit,
  bun: Bun.version, platform: process.platform, arch: process.arch, versions: process.versions,
  sourceHashes, peers, fixtureGzipSha256: hash(compressed), fixtureDecodedSha256: hash(decoded),
  inputJsonSha256: hash(Buffer.from(immutableBefore)), actualFlatSha256: hash(flatBytes),
  expectedCapturedFlatSha256: "2fa8eb9fe49de5c38d37dc7d0a69aa68b56b4c547726743027bd8e9a59089a6e",
  sortedFlatSha256: hash(Buffer.from(JSON.stringify(sortKeys(flat)))),
  untouchedNativeObstaclesExact: JSON.stringify(flat.obstacles.slice(0,445)) === JSON.stringify(before.obstacles),
  inputUnchanged: JSON.stringify(before) === immutableBefore, routerInvoked: false }
let emittedBytes = 0
const emit = (record) => {
  const line = "CORE_FIXED_REPLAY_V1 " + JSON.stringify(record) + "\n"
  const bytes = Buffer.byteLength(line, "utf8")
  assert(bytes <= 16 * 1024, "Protocol line exceeds 16 KiB")
  assert(emittedBytes + bytes <= 3 * 1024 * 1024, "Protocol exceeds 3 MiB")
  emittedBytes += bytes
  process.stdout.write(line)
}
emit({ kind: "header", ...header })
for (const [name, bytes] of [
  ["flat.json", flatBytes],
  ["diagonal-math.json", Buffer.from(JSON.stringify(diagonalMath))],
]) {
  const gzip = gzipSync(bytes, { mtime: 0 })
  const encoded = gzip.toString("base64")
  const parts = Math.ceil(encoded.length / 12000)
  emit({ kind: "file", name, rawBytes: bytes.length, rawSha256: hash(bytes), gzipBytes: gzip.length,
    gzipSha256: hash(gzip), rawGitBlob: gitBlob(bytes), encodedChars: encoded.length, parts })
  for (let part = 0; part < parts; part++) emit({ kind: "part", name, part, parts, data: encoded.slice(part * 12000, (part + 1) * 12000) })
  assert(bytes.length <= 1024 * 1024, "Plain UTF-8 JSON exceeds 1 MiB")
  const text = bytes.toString("utf8")
  assert(Buffer.from(text, "utf8").equals(bytes), "JSON is not valid UTF-8")
  const plainParts = []
  let pendingText = "", pendingBytes = 0
  for (const character of text) {
    const characterBytes = Buffer.byteLength(character, "utf8")
    if (pendingBytes + characterBytes > 6000) {
      plainParts.push(pendingText)
      pendingText = ""
      pendingBytes = 0
    }
    pendingText += character
    pendingBytes += characterBytes
  }
  if (pendingText) plainParts.push(pendingText)
  emit({ kind: "utf8_file", name, rawBytes: bytes.length, rawSha256: hash(bytes), rawGitBlob: gitBlob(bytes), parts: plainParts.length })
  for (const [part, text] of plainParts.entries()) {
    const partBytes = Buffer.from(text, "utf8")
    emit({ kind: "utf8_part", name, part, parts: plainParts.length, rawPartBytes: partBytes.length, rawPartSha256: hash(partBytes), text })
  }
}
emit({ kind: "end", files: 2, actualFlatSha256: hash(flatBytes), actualFlatGitBlob: gitBlob(flatBytes), protocolBytesBeforeEnd: emittedBytes, routerInvoked: false })
