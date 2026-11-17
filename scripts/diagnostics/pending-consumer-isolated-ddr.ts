/** Disposable diagnostic only. It does not implement routing or acceptance. */
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  writeFileSync,
} from "node:fs"
import { cpus, totalmem } from "node:os"
import { join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { gzipSync } from "node:zlib"

type JsonRecord = Record<string, unknown>
const [mode, workspaceArgument, outputArgument] = process.argv.slice(2)
assert(workspaceArgument && outputArgument, "Expected mode, workspace and evidence directory")
const workspace = resolve(workspaceArgument)
const output = resolve(outputArgument)
mkdirSync(output, { recursive: true })
const pins = JSON.parse(readFileSync(new URL("./pending-consumer-isolated-ddr.pins.json", import.meta.url), "utf8"))
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex")
const json = (file: string) => JSON.parse(readFileSync(file, "utf8"))
const save = (file: string, value: unknown) => writeFileSync(join(output, file), JSON.stringify(value, null, 2) + "\n")
const git = (directory: string, args: string[]) => execFileSync("git", ["-C", directory, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trimEnd()
const directoryFor = (name: string) => join(workspace, name)
const benchmark = join(directoryFor("tooling"), "node_modules/@tscircuit/core-ddr-benchmark")
const isRecord = (value: unknown): value is JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value)

function validatePins() {
  assert.equal(pins.schema, "pending-consumer-isolated-ddr/v1")
  assert.equal(pins.repository, "tscircuit/core")
  assert.equal(pins.diagnosticBranch, "diagnostics/pending-consumer-isolated-ddr")
  for (const name of ["controllerCommit", "benchmarkCommit", "baselineCommit", "consumerCommit", "consumerBusCommit"])
    assert.match(pins[name], /^[a-f0-9]{40}$/, `Unbound or invalid ${name}`)
  for (const name of ["baselineBusExecutableSha256", "consumerBusExecutableSha256"])
    assert.match(pins[name], /^[a-f0-9]{64}$/, `Unbound or invalid ${name}`)
  assert.equal(pins.controllerCommit, "eec574170499b2e7ce9b23c4c72b5f2ea7fc2dad")
  assert.equal(pins.baselineCommit, "17bd033553ee56ea1130315d2910fd810abf928f")
  assert.equal(pins.benchmarkCommit, "24dc44c166d4258c3538f8b1f66953f1b6f58690")
  assert.equal(pins.renderBudgetSeconds, 300)
  assert.equal(pins.bunVersion, "1.4.3")
  assert.equal(pins.baselineBusUrl, "https://jscdn.tscircuit.com/@tscircuit/bus-lanes-solver/0.0.61.tgz")
  assert.match(pins.consumerBusUrl, /^https:\/\/pkg\.pr\.new\/tscircuit\/bus-lanes-solver\/@tscircuit\/bus-lanes-solver@[a-f0-9]{7,40}$/)
  const previewRef = pins.consumerBusUrl.split("@").at(-1)
  assert(pins.consumerBusCommit.startsWith(previewRef))
  assert.deepEqual(pins.expectedCircuitIds, ["h3", "a64", "stmp157", "orangecrab", "a13", "h616", "butterstick", "glider", "imx6", "icepi"])
}

function sourceSnapshot(name: string) {
  const directory = directoryFor(name)
  const expected = name === "capture" ? process.env.GITHUB_SHA : name === "tooling" ? pins.controllerCommit : name === "base" ? pins.baselineCommit : pins.consumerCommit
  assert.equal(git(directory, ["rev-parse", "HEAD"]), expected)
  // Canonical bun install may update its lock metadata. Every other tracked
  // source, fixture, rule and package declaration must retain its Git bytes.
  git(directory, ["diff", "--exit-code", "HEAD", "--", ".", ":(exclude)bun.lock", ":(exclude)bun.lockb"])
  const untracked = git(directory, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean).filter(file => file !== "bun.lock" && file !== "bun.lockb")
  assert.deepEqual(untracked, [], `${name}: unexpected untracked source`)
  const files = git(directory, ["ls-files", "-z"]).split("\0").filter(Boolean).filter(file => file !== "bun.lock" && file !== "bun.lockb").sort()
  const digest = createHash("sha256")
  const records = files.map(file => {
    const path = join(directory, file)
    const stat = lstatSync(path)
    assert(stat.isFile() || stat.isSymbolicLink(), `Unsupported tracked file ${name}/${file}`)
    const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path)
    const sha256 = hash(bytes)
    digest.update(file).update("\0").update(sha256).update("\0")
    return { path: file, bytes: bytes.length, sha256, symbolicLink: stat.isSymbolicLink() }
  })
  const locks = ["bun.lock", "bun.lockb"].filter(file => existsSync(join(directory, file))).map(file => ({ path: file, sha256: hash(readFileSync(join(directory, file))) }))
  return { commit: expected, sourceSha256: digest.digest("hex"), records, installedLockFiles: locks }
}

function installedDependencies(name: string) {
  const directory = directoryFor(name)
  const declared = json(join(directory, "package.json"))
  const busDeclaration = declared.devDependencies?.["@tscircuit/bus-lanes-solver"]
  assert.equal(busDeclaration, name === "head" ? pins.consumerBusUrl : pins.baselineBusUrl)
  const expected = name === "tooling" ? pins.expectedControllerDependencies : pins.expectedDependencies
  const packages = Object.entries(expected).map(([packageName, expectedVersion]) => {
    const packageDirectory = join(directory, "node_modules", packageName)
    const packageBytes = readFileSync(join(packageDirectory, "package.json"))
    const metadata = JSON.parse(packageBytes.toString("utf8"))
    assert.equal(metadata.name, packageName)
    assert.equal(metadata.version, expectedVersion, `${name}: ${packageName} drifted`)
    const entry = Bun.resolveSync(packageName, directory)
    const executableSha256 = hash(readFileSync(entry))
    if (packageName === "@tscircuit/bus-lanes-solver")
      assert.equal(executableSha256, name === "head" ? pins.consumerBusExecutableSha256 : pins.baselineBusExecutableSha256)
    return { name: packageName, version: metadata.version, packageSha256: hash(packageBytes), entry: relative(directory, entry), executableSha256 }
  })
  return { busDeclaration, packages }
}

async function captureProvenance() {
  validatePins()
  assert.equal(Bun.version, pins.bunVersion)
  assert.equal(process.platform, "linux")
  assert.equal(process.env.GITHUB_REPOSITORY, pins.repository)
  assert.equal(process.env.GITHUB_EVENT_NAME, "push")
  assert.equal(process.env.GITHUB_REF, `refs/heads/${pins.diagnosticBranch}`)
  assert.match(process.env.GITHUB_SHA ?? "", /^[a-f0-9]{40}$/)
  assert.deepEqual(git(directoryFor("capture"), ["show", "-s", "--format=%P", "HEAD"]).split(" "), [pins.consumerCommit])
  const delta = git(directoryFor("capture"), ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]).split("\n").filter(Boolean).sort()
  assert.deepEqual(delta, [...pins.diagnosticFiles].sort(), "The disposable commit must add only its three declared diagnostic files")
  const controllerPackage = json(join(directoryFor("tooling"), "package.json"))
  assert.equal(controllerPackage.devDependencies["@tscircuit/core-ddr-benchmark"], `github:ShiboSoftwareDev/core-ddr-benchmark#${pins.benchmarkCommit}`)
  const { fingerprint } = await import(pathToFileURL(join(benchmark, "scripts/fingerprint.ts")).href)
  assert.equal(fingerprint(benchmark), pins.benchmarkFingerprint)
  const manifest = json(join(benchmark, "manifest.json"))
  assert.deepEqual(manifest.circuits.map((fixture: JsonRecord) => fixture.id), pins.expectedCircuitIds)
  const fixtures = manifest.circuits.map((fixture: { id: string; file: string; sha256: string; nets: number; pads: number }) => {
    const bytes = readFileSync(join(benchmark, fixture.file))
    assert.equal(hash(bytes), fixture.sha256)
    return { id: fixture.id, file: fixture.file, sha256: fixture.sha256, bytes: bytes.length, nets: fixture.nets, pads: fixture.pads }
  })
  const sources = Object.fromEntries(["capture", "tooling", "base", "head"].map(name => [name, sourceSnapshot(name)]))
  const dependencies = { tooling: installedDependencies("tooling"), base: installedDependencies("base"), head: installedDependencies("head") }
  for (const basePackage of dependencies.base.packages) {
    if (basePackage.name === "@tscircuit/bus-lanes-solver") continue
    const headPackage = dependencies.head.packages.find(item => item.name === basePackage.name)
    assert(headPackage)
    assert.equal(basePackage.packageSha256, headPackage.packageSha256, `${basePackage.name}: different installed package metadata`)
    assert.equal(basePackage.executableSha256, headPackage.executableSha256, `${basePackage.name}: different installed executable`)
  }
  return { schema: pins.schema, pins, sources, dependencies, fixtures, benchmarkFingerprint: fingerprint(benchmark), environment: { bun: Bun.version, platform: process.platform, architecture: process.arch, cpuModels: [...new Set(cpus().map(cpu => cpu.model))], cpuCount: cpus().length, totalMemoryBytes: totalmem(), runId: process.env.GITHUB_RUN_ID, job: process.env.GITHUB_JOB, runnerName: process.env.RUNNER_NAME, jscForceRamSize: process.env.BUN_JSC_forceRAMSize ?? null, jscMiniVmHeapGrowthFactor: process.env.BUN_JSC_miniVMHeapGrowthFactor ?? null } }
}

function verifySourcesUnchanged(before: Awaited<ReturnType<typeof captureProvenance>>, after: Awaited<ReturnType<typeof captureProvenance>>) {
  assert.deepEqual(after.pins, before.pins)
  for (const name of ["capture", "tooling", "base", "head"])
    assert.deepEqual(after.sources[name], before.sources[name], `${name}: source or installed lock bytes changed during execution`)
  assert.deepEqual(after.dependencies, before.dependencies)
  assert.deepEqual(after.fixtures, before.fixtures)
  assert.equal(after.benchmarkFingerprint, before.benchmarkFingerprint)
}

function resultFor(name: string) {
  const report = json(join(output, name, "results.json"))
  assert.equal(report.coreCommit, name === "base" ? pins.baselineCommit : pins.consumerCommit)
  assert.equal(report.bunVersion, pins.bunVersion)
  assert.equal(report.timeoutSeconds, pins.renderBudgetSeconds)
  assert.equal(report.geometryOnly, false)
  assert.equal(report.benchmarkRevision, pins.benchmarkFingerprint)
  assert.equal(report.assessmentRevision, pins.benchmarkFingerprint)
  assert.deepEqual(report.dependencies, pins.expectedDependencies)
  assert.deepEqual(report.cases.map((row: JsonRecord) => row.circuit), pins.expectedCircuitIds)
  const manifest = json(join(benchmark, "manifest.json"))
  assert.deepEqual(report.fixtureHashes, Object.fromEntries(manifest.circuits.map((fixture: JsonRecord) => [fixture.id, fixture.sha256])))
  for (const row of report.cases) {
    assert(["passed", "failed", "timeout", "crashed"].includes(row.status))
    assert(Number.isFinite(row.wallMs) && row.wallMs >= 0)
    assert(Number.isFinite(row.peakRssMb) && row.peakRssMb >= 0)
  }
  return report
}

async function renderSavedCircuitSnapshots(name: string) {
  const report = resultFor(name)
  const module = await import(pathToFileURL(Bun.resolveSync("circuit-to-svg", directoryFor("head"))).href)
  assert.equal(typeof module.convertCircuitJsonToPcbSvg, "function")
  const records = []
  const snapshotDirectory = join(output, "saved-copper-snapshots", name)
  mkdirSync(snapshotDirectory, { recursive: true })
  for (const row of report.cases) {
    const circuitFile = join(output, name, row.circuit, "circuit.json")
    if (!existsSync(circuitFile)) {
      records.push({ circuit: row.circuit, status: row.status, available: false, reason: "Canonical worker saved no Circuit JSON; no copper image fabricated" })
      continue
    }
    const original = readFileSync(circuitFile)
    const elements: unknown = JSON.parse(original.toString("utf8"))
    assert(Array.isArray(elements) && elements.every(isRecord))
    const board = elements.find(element => element.type === "pcb_board")
    if (!board || typeof board.width !== "number" || typeof board.height !== "number" || !isRecord(board.center) || typeof board.center.x !== "number" || typeof board.center.y !== "number") {
      assert.notEqual(row.status, "passed", "Accepted canonical output has no renderable PCB board")
      records.push({ circuit: row.circuit, status: row.status, available: false, circuitJsonSha256: hash(original), reason: "Actual failed/incomplete Circuit JSON has no PCB board to draw; no geometry fabricated" })
      continue
    }
    const center = { x: board.center.x, y: board.center.y }
    const caption = `${name.toUpperCase()} | ${row.title} | canonical outcome: ${row.status.toUpperCase()}`
    const assessment = row.assessment
    const findings = assessment ? Object.values(assessment.findings) : []
    assert(findings.every(value => typeof value === "number"))
    const drc = assessment ? findings.map(Number).reduce((sum, value) => sum + value, 0) : null
    const detail = assessment ? `${assessment.connectedNets}/${assessment.requestedNets} connected nets; ${drc} canonical DRC findings; ${(row.wallMs / 1000).toFixed(1)}s; ${row.peakRssMb > 0 ? row.peakRssMb.toFixed(1) + " MiB sampled render RSS" : "RSS unavailable"}` : "Canonical assessment unavailable; this image is not completion or DRC evidence"
    const phase = row.progress?.phases?.findLast((item: JsonRecord) => item.status !== "completed")
    const note = row.status === "passed" ? "Actual final Circuit JSON; phase SRJs and assessments are retained alongside this image" : `FAILED / INCOMPLETE copper only; ${phase ? `unfinished phase ${phase.phase}` : "see canonical progress and render log"}; rejected candidates are not drawn`
    const captions = [caption, detail, note]
    const font = 0.45
    const headerTop = center.y + board.height / 2 + 3
    const halfWidth = Math.max(board.width / 2 + 1, ...captions.map(text => text.length * font / 2 + 1))
    const annotations = captions.map((text, index) => ({ type: "pcb_note_text", pcb_note_text_id: `isolated_benchmark_caption_${index}`, pcb_group_id: "benchmark_status", text, anchor_position: { x: center.x, y: headerTop - index * 0.85 }, font: "tscircuit2024", layer: "top", font_size: font, anchor_alignment: "center" }))
    const svg: string = module.convertCircuitJsonToPcbSvg([...elements, ...annotations], { backgroundColor: "white", width: 1500, height: 1000, shouldDrawErrors: false, shouldDrawRatsNest: false, showErrorsInTextOverlay: false, showDebugObjects: false, showPcbGroups: false, viewport: { minX: center.x - halfWidth, maxX: center.x + halfWidth, minY: center.y - board.height / 2 - 1, maxY: headerTop + 1 } })
    assert(svg.includes("<svg"))
    const file = `${row.circuit}-${row.status}.svg`
    writeFileSync(join(snapshotDirectory, file), svg)
    assert.equal(hash(readFileSync(circuitFile)), hash(original), "Rendering changed saved copper")
    records.push({ circuit: row.circuit, status: row.status, available: true, path: relative(output, join(snapshotDirectory, file)), circuitJsonSha256: hash(original), svgSha256: hash(svg), connectedNets: assessment?.connectedNets ?? null, requestedNets: assessment?.requestedNets ?? null, canonicalDrcFindings: drc, completionEvidence: row.status === "passed" })
  }
  return records
}

function artifactFiles(directory: string): { path: string; bytes: number; sha256: string }[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) return artifactFiles(file)
    assert(entry.isFile(), "Evidence tree must not contain symbolic links")
    return [{ path: relative(output, file), bytes: lstatSync(file).size, sha256: hash(readFileSync(file)) }]
  })
}

// Public fixture/result bytes only. This optional log transport never replaces
// the uploaded artifact or changes a canonical outcome. Checksums let readers
// reject truncation, missing chunks or interleaved runner output.
function emitPublicFiles(paths: string[]) {
  let emittedBytes = 0
  const records = []
  for (const path of paths) {
    const file = join(output, path)
    if (!existsSync(file)) {
      const record = { path, emitted: false, reason: "Evidence file was not produced; see original failure and partial artifacts" }
      console.log("ISOLATED_DDR_CAPTURE_OMITTED " + JSON.stringify(record))
      records.push(record)
      continue
    }
    const bytes = readFileSync(file)
    const compressed = gzipSync(bytes, { level: 9 })
    const encoded = compressed.toString("base64")
    const metadata = { kind: path, encoding: "gzip+base64", decodedBytes: bytes.length, decodedSha256: hash(bytes), gzipBytes: compressed.length, gzipSha256: hash(compressed), base64Characters: encoded.length }
    const packet = "ISOLATED_DDR_CAPTURE_BEGIN " + JSON.stringify(metadata) + "\n" + (encoded.match(/.{1,120}/g)?.join("\n") ?? "") + "\nISOLATED_DDR_CAPTURE_END " + path + "\n"
    if (compressed.length > 1024 * 1024 || emittedBytes + Buffer.byteLength(packet) > 3 * 1024 * 1024) {
      const record = { ...metadata, emitted: false, reason: "Optional log transport budget exceeded; full original file remains in the artifact" }
      console.log("ISOLATED_DDR_CAPTURE_OMITTED " + JSON.stringify(record))
      records.push(record)
      continue
    }
    process.stdout.write(packet)
    emittedBytes += Buffer.byteLength(packet)
    records.push({ ...metadata, emitted: true })
  }
  save("log-capture-index.json", { emittedBytes, records, note: "Only individually SHA256-verified complete packets are recoverable evidence; omitted or partial packets are not complete captures." })
}

validatePins()
if (mode === "before") {
  save("provenance-before.json", await captureProvenance())
} else if (mode === "after") {
  const before = json(join(output, "provenance-before.json"))
  const after = await captureProvenance()
  verifySourcesUnchanged(before, after)
  const base = resultFor("base")
  const head = resultFor("head")
  const snapshots = { base: await renderSavedCircuitSnapshots("base"), head: await renderSavedCircuitSnapshots("head") }
  save("saved-copper-snapshots/index.json", snapshots)
  save("provenance-after.json", after)
  save("isolated-comparison-scope.json", { baselineCommit: pins.baselineCommit, consumerCommit: pins.consumerCommit, control: "Same Core via-span fix; released bus0.0.61 versus exact consumer build. Feature PR base is unchanged.", canonicalOutcomes: { base: base.cases.map((row: JsonRecord) => ({ circuit: row.circuit, status: row.status })), head: head.cases.map((row: JsonRecord) => ({ circuit: row.circuit, status: row.status })) }, sourceAndFixtureBytesUnchanged: true, acceptanceImplementation: "Unmodified pinned core-ddr-benchmark/scripts/run.ts and assess.ts", memoryScope: "Canonical fresh render worker Linux VmHWM sampled every50ms; excludes separate validation process; zero stays unavailable, never inferred", snapshots: "Presentation of the actual saved Circuit JSON, clearly labelled with unchanged canonical outcome. No new acceptance rule.", nativeH3Proof: "Separate job uses the same final-head native TSX proof driver against both Core checkouts; its diagnostic timing is separate from canonical benchmark costs." })
  emitPublicFiles(["base/results.json", "head/results.json", "comparison.md", "isolated-comparison-scope.json", "saved-copper-snapshots/index.json", "base/h616/phase-1-start.srj.json", "head/h616/phase-1-start.srj.json", "head/h616/progress.json", "head/h616/render.log"])
  save("artifact-file-sha256.json", artifactFiles(output).filter(file => file.path !== "artifact-file-sha256.json"))
} else if (mode === "native-after") {
  const before = json(join(output, "provenance-before.json"))
  const after = await captureProvenance()
  verifySourcesUnchanged(before, after)
  save("provenance-after.json", after)
  save("native-proof-scope.json", { baselineCommit: pins.baselineCommit, consumerCommit: pins.consumerCommit, sourceAndFixtureBytesUnchanged: true, proofImplementation: "Unmodified final-head scripts/diagnostics/run-native-h3-routing-access.ts, native-h3-routing-access.tsx and compare-native-h3-routing-inputs.ts", baselinePartiality: "Baseline may fail or omit later-phase evidence; preserve the existing comparator's nonzero exit and report fields. Do not reinterpret unobserved phases as matching.", budgets: { renderSeconds: 300, assessmentSeconds: 120 }, memoryScope: "Separate diagnostic worker includes observations; use the all-ten canonical run for product runtime/RSS costs." })
  const proofFiles = ["baseline", "consumer"].flatMap(name => ["routing-proof.json", "assessment.json", "resources.json", "input-evidence.json"].map(file => `${name}/${file}`))
  const views = ["baseline", "consumer"].flatMap(name => existsSync(join(output, name)) ? readdirSync(join(output, name)).filter(file => file.endsWith(".svg")).sort().map(file => `${name}/${file}`) : [])
  emitPublicFiles([...proofFiles, "consumer/paired-input-comparison.json", "exit-statuses.txt", "native-proof-scope.json", ...views])
  save("artifact-file-sha256.json", artifactFiles(output).filter(file => file.path !== "artifact-file-sha256.json"))
} else {
  throw new Error("Expected before, after or native-after")
}
