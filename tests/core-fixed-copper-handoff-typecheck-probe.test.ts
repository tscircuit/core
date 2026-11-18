import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { isAbsolute, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "bun:test"

// TEMP diagnostic only. This helper stays in the capture checkout; the actual
// project's compiler runs against a second pristine, exact source checkout.
const expectedCommit = "e8a18a2e0f2d5365549e935c5bbdbd3649ef8f3b"
const expectedTree = "c8d82e092b502d0662b2c22d62979b3c21bfdc7b"
const expectedBus = "https://jscdn.tscircuit.com/@tscircuit/bus-lanes-solver/0.0.58.tgz"
const ownerManifestSha256 = "4ad3677ffc643aa5b8731296e29e86089429577aa7839e010173c76a43106b8d"
const protectedHashes: Record<string, string> = {
  "AGENTS.md": "5590aea42cd463ed37410e4c207e01ecfa649fd59e8693d609aaa8962342aa3f",
  "package.json": "0aac609ee2c4da97f4a9a63e0bcfc9744585247dde7b83be0657d64f370f87e8",
  "biome.json": "b91abff9efbe0e67041208ad1d86f1682f0fb83d7134a3447f63d747a3d86470",
  "tsconfig.json": "080cea34b88a5806ba8b17d2237399b46d1b5a55a32b7bd5c93ce409e8355076",
  "bunfig.toml": "6964eb4d76b1416492345cf77f3de389f2de061aad3da58ef6d751814a4e286c",
}
const ownerFiles: { path: string; bytes: number; sha256: string; gitBlobSha1: string }[] =
  [
  {
    "path": "tests/fixtures/fixed-copper-handoff/board.tsx",
    "bytes": 1482,
    "sha256": "1d7d3e8c589f1dd5f97b35cb1ddb2cf0a8b5f54c8982e948641a4b4e54ebf653",
    "gitBlobSha1": "ef01c44b3d811b6ec546116256013e64f308d350"
  },
  {
    "path": "tests/fixtures/fixed-copper-handoff/native-h3.provenance.json",
    "bytes": 1249,
    "sha256": "8902290c0417edd7e6f08be1afbdcb167673d87ea6a0282fbe40e632e09e570b",
    "gitBlobSha1": "d3007480ca431dd1b536a35b3ce78af0093f612b"
  },
  {
    "path": "tests/fixtures/fixed-copper-handoff/native-h3.srj.json.gz",
    "bytes": 16024,
    "sha256": "28204b54e27e98ee490bb9b9c4949a9f03f2534325159633125460336c8cf28b",
    "gitBlobSha1": "2050278108bb2e4377d07c96de56974c45b70207"
  },
  {
    "path": "tests/fixtures/fixed-copper-handoff/snapshot.ts",
    "bytes": 3750,
    "sha256": "0d55ce23824a1b01fd0a413d1ed0ebdfabfbd398171cd2d4e1e902d409785d42",
    "gitBlobSha1": "94712ef869d8a4313de80bd774e9d7fc378e20ef"
  },
  {
    "path": "tests/repros/__snapshots__/repro-fixed-copper-handoff.snap.svg",
    "bytes": 5599,
    "sha256": "4f33ce38c96538f0d5421c2968f3b3410e83c709f5c072085be0fec8221f1e31",
    "gitBlobSha1": "94606b8e1becc4bcbbe6297e53021a2d97a367b8"
  },
  {
    "path": "tests/repros/repro-fixed-copper-handoff.test.tsx",
    "bytes": 4211,
    "sha256": "d93d66ebbd938ec1180a82d546862d74dccd586d0bbde5949f9a7f4251f2f815",
    "gitBlobSha1": "b3577d0e0f709f4164b24d1df64bd5de6c34fb35"
  },
  {
    "path": "tests/utils/autorouting/__snapshots__/native-h3-fixed-copper-handoff.snap.svg",
    "bytes": 283113,
    "sha256": "2bddf6c6801da4384289a6a5927fc03f58dfcea4cac4d2292c3773774cc548d1",
    "gitBlobSha1": "49a4399b7346e9331afe609a7894e88c1b74b236"
  },
  {
    "path": "tests/utils/autorouting/native-h3-fixed-copper-handoff.test.ts",
    "bytes": 2032,
    "sha256": "69f15d855cf42b6c927b5c6cafb72379acc05793866e05a5617ca812416da803",
    "gitBlobSha1": "1c19df53e6f2bb8aadccaee63621741fc8bcc502"
  }
]

const maximumCompilerBytes = 4 * 1024 * 1024
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex")
const gitBlob = (bytes: Buffer) => createHash("sha1")
  .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex")

type TrackedFile = { path: string; blob: string }
type CompilerResult = { status: number | null; signal: string | null; stdout: string; stderr: string; error?: string }

function compactDiagnostics(result: CompilerResult) {
  const lines = (result.stdout + "\n" + result.stderr).split(/\r?\n/)
    .filter((line) => line.trim() && !isExistingProgramFile(line))
  const codes: Record<string, number> = {}
  for (const line of lines) {
    const code = line.match(/\berror TS([0-9]+):/)
    if (code) codes[code[1]] = (codes[code[1]] ?? 0) + 1
  }
  return { diagnosticLineCount: lines.length, diagnosticCodes: codes,
    firstDiagnosticLines: lines.slice(0, 40).map((line) => line.slice(0, 700)),
    processError: result.error, signal: result.signal }
}

function isExistingProgramFile(value: string): boolean {
  return isAbsolute(value) && existsSync(value) && statSync(value).isFile()
}

function programFiles(result: CompilerResult): string[] {
  const files = result.stdout.split(/\r?\n/).filter(isExistingProgramFile)
  assert(files.length > 0, "Installed compiler did not report any project files")
  return [...new Set(files.map((path) => resolve(path)))].sort()
}

function trackedFingerprint({ source, entries }: { source: string; entries: TrackedFile[] }): string {
  const hash = createHash("sha256")
  for (const entry of entries) {
    const bytes = readFileSync(resolve(source, entry.path))
    assert.equal(gitBlob(bytes), entry.blob, `Tracked source changed: ${entry.path}`)
    hash.update(entry.path + "\0" + sha256(bytes) + "\n")
  }
  return hash.digest("hex")
}

function projectFingerprint({
  source, captureFile, files, trackedPaths,
}: {
  source: string; captureFile: string; files: string[]; trackedPaths: ReadonlySet<string>
}): string {
  const hash = createHash("sha256")
  for (const path of files) {
    const physical = realpathSync(path)
    assert(physical.startsWith(source + sep), "Compiler resolved outside its exact source checkout: " + path)
    assert.notEqual(physical, captureFile, "TEMP helper entered the compiler project")
    const projectPath = relative(source, physical).split(sep).join("/")
    if (!projectPath.startsWith("node_modules/")) {
      assert(trackedPaths.has(projectPath), "Untracked source entered the compiler project: " + projectPath)
    }
    const bytes = readFileSync(physical)
    hash.update(relative(source, path).split(sep).join("/") + "\0" + sha256(bytes) + "\n")
  }
  return hash.digest("hex")
}

test.skipIf(process.env.CORE_TYPECHECK_SOURCE_DIRECTORY === undefined)(
  "TEMP: strict installed TypeScript checks the exact clean Core repro project",
  () => {
    assert.match(expectedCommit, /^[0-9a-f]{40}$/)
    assert.match(expectedTree, /^[0-9a-f]{40}$/)
    const source = realpathSync(resolve(process.env.CORE_TYPECHECK_SOURCE_DIRECTORY!))
    const captureFile = realpathSync(fileURLToPath(import.meta.url))
    assert(!captureFile.startsWith(source + sep), "Capture helper must be outside compiler checkout")
    assert.equal(Bun.version, "1.4.2")
    const git = (args: string[]) => execFileSync("git", args, {
      cwd: source, encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    })
    const clean = () => git(["diff", "--exit-code", "HEAD", "--", ".",
      ":(exclude)bun.lock", ":(exclude)bun.lockb"])
    assert.equal(git(["rev-parse", "HEAD"]).trim(), expectedCommit)
    assert.equal(git(["rev-parse", "HEAD^{tree}"]).trim(), expectedTree)
    clean()
    const checkProtected = () => {
      for (const [path, expected] of Object.entries(protectedHashes)) {
        assert.equal(sha256(readFileSync(resolve(source, path))), expected,
          "Actual protected Core file changed: " + path)
      }
    }
    checkProtected()
    assert.equal(ownerFiles.length, 8)
    for (const entry of ownerFiles) {
      const bytes = readFileSync(resolve(source, entry.path))
      assert.equal(bytes.length, entry.bytes)
      assert.equal(sha256(bytes), entry.sha256)
      assert.equal(gitBlob(bytes), entry.gitBlobSha1)
    }
    const rows = git(["ls-tree", "-rz", "--full-tree", "HEAD"]).split("\0").filter(Boolean)
    const tracked: TrackedFile[] = rows.flatMap((row) => {
      const separator = row.indexOf("\t")
      const [, kind, blob] = row.slice(0, separator).split(" ")
      return kind === "blob" ? [{ path: row.slice(separator + 1), blob }] : []
    })
    const trackedPaths = new Set(tracked.map((entry) => entry.path))
    const relevant = tracked.filter((entry) => /\.(?:[cm]?[jt]sx?|json)$/.test(entry.path))
      .sort((left, right) => left.path.localeCompare(right.path))
    assert(relevant.length > 0)
    const before = trackedFingerprint({ source, entries: relevant })
    const require = createRequire(resolve(source, "package.json"))
    const ts = require("typescript") as typeof import("typescript")
    const tsPackage = JSON.parse(readFileSync(require.resolve("typescript/package.json"), "utf8"))
    const compiler = require.resolve("typescript/bin/tsc")
    const sourceNodeModules = realpathSync(resolve(source, "node_modules"))
    assert(sourceNodeModules.startsWith(source + sep))
    assert(realpathSync(compiler).startsWith(sourceNodeModules + sep),
      "Compiler must come from the actual installed source dependency tree")
    assert(realpathSync(require.resolve("typescript")).startsWith(sourceNodeModules + sep))
    assert.equal(tsPackage.name, "typescript")
    assert.equal(tsPackage.version, "5.9.3")
    assert.equal(ts.version, "5.9.3")
    const parsed = ts.getParsedCommandLineOfConfigFile(resolve(source, "tsconfig.json"), {}, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        throw new Error("Actual tsconfig parse failed: TS" + diagnostic.code)
      },
    })
    assert(parsed)
    assert.equal(parsed.errors.length, 0)
    assert.equal(parsed.options.strict, true)
    assert(parsed.fileNames.length > 0)
    for (const path of parsed.fileNames) {
      assert(!realpathSync(path).startsWith(resolve(captureFile, "..") + sep),
        "TEMP capture directory entered project roots")
    }
    const declared = JSON.parse(readFileSync(resolve(source, "package.json"), "utf8"))
    assert.equal(declared.devDependencies["@tscircuit/bus-lanes-solver"], expectedBus)
    const busDirectory = resolve(source, "node_modules/@tscircuit/bus-lanes-solver")
    const physicalBusDirectory = realpathSync(busDirectory)
    assert(physicalBusDirectory.startsWith(sourceNodeModules + sep),
      "Bus solver must come from the actual installed source dependency tree")
    const bus = JSON.parse(readFileSync(resolve(busDirectory, "package.json"), "utf8"))
    assert.equal(bus.name, "@tscircuit/bus-lanes-solver")
    assert.equal(bus.version, "0.0.58")
    const busEntry = bus.exports?.["."]?.import ?? bus.module ?? bus.main
    assert.equal(typeof busEntry, "string")
    const busExecutable = realpathSync(resolve(busDirectory, busEntry))
    assert(busExecutable.startsWith(physicalBusDirectory + sep),
      "Bus executable escaped the actual installed solver package")
    const busExecutableSha256 = sha256(readFileSync(busExecutable))
    const runCompiler = (args: string[], timeout: number): CompilerResult => {
      const result = spawnSync(process.execPath, [compiler, "--project", "tsconfig.json",
        "--noEmit", "--pretty", "false", ...args], {
        cwd: source, encoding: "utf8", timeout, maxBuffer: maximumCompilerBytes,
      })
      return { status: result.status, signal: result.signal,
        stdout: result.stdout ?? "", stderr: result.stderr ?? "",
        error: result.error?.message?.slice(0, 700) }
    }
    const environment = {
      sourceHead: expectedCommit, sourceTree: expectedTree,
      ownerManifestSha256, trackedRelevantSourceFiles: relevant.length,
      trackedSourceSha256: before, programRootFiles: parsed.fileNames.length,
      tsconfigSha256: protectedHashes["tsconfig.json"], strict: parsed.options.strict,
      bun: Bun.version, typescript: ts.version,
      compilerSha256: sha256(readFileSync(compiler)),
      compilerLibrarySha256: sha256(readFileSync(require.resolve("typescript"))),
      declaredBus: expectedBus, installedBusVersion: bus.version,
      installedBusExecutableSha256: busExecutableSha256,
      installedBusPackageDirectory: relative(source, physicalBusDirectory),
      captureHelperOutsideCompilerCheckout: true,
      command: "installed typescript/bin/tsc --project tsconfig.json --noEmit --pretty false --listFiles",
    }
    const inventory = runCompiler(["--listFilesOnly"], 90_000)
    if (inventory.status !== 0 || inventory.error) {
      console.log("CORE_FIXED_COPPER_TYPECHECK_FAILED " + JSON.stringify({
        ...environment, stage: "program-inventory", status: inventory.status,
        ...compactDiagnostics(inventory),
      }))
      assert.fail("Actual source compiler inventory failed")
    }
    const files = programFiles(inventory)
    const programBefore = projectFingerprint({ source, captureFile, files, trackedPaths })
    console.log("CORE_FIXED_COPPER_TYPECHECK_START " + JSON.stringify({
      ...environment, programFiles: files.length, programFilesSha256: programBefore,
    }))
    const result = runCompiler(["--listFiles"], 900_000)
    clean()
    checkProtected()
    assert.equal(trackedFingerprint({ source, entries: relevant }), before)
    assert.equal(projectFingerprint({ source, captureFile, files, trackedPaths }), programBefore)
    assert.equal(sha256(readFileSync(busExecutable)), busExecutableSha256)
    if (result.status !== 0 || result.error) {
      console.log("CORE_FIXED_COPPER_TYPECHECK_FAILED " + JSON.stringify({
        ...environment, stage: "strict-project-typecheck", status: result.status,
        programFiles: files.length, programFilesSha256: programBefore,
        ...compactDiagnostics(result),
      }))
      assert.fail("Actual strict Core project typecheck failed")
    }
    assert.deepEqual(programFiles(result), files, "Compiler project inventory changed between passes")
    console.log("CORE_FIXED_COPPER_CANONICAL_TYPECHECK_PASS " + JSON.stringify({
      ...environment, programFiles: files.length, programFilesSha256: programBefore,
      exactSourceCheckout: true, noTempFilesInCompiler: true,
      allProgramFileBytesUnchanged: true,
    }))
  },
  1_080_000,
)
