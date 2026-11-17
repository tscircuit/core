import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { basename, dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync, gunzipSync } from "node:zlib"
import { test } from "bun:test"
import type * as TypeScript from "typescript"

// TEMPORARY DIAGNOSTIC ONLY. Copy this file and its companion manifest to the
// checkpoint's tests directory on a disposable branch. The manifest must come
// from the refreshed official publish manifest, never from this older workspace.
// The separate read-only, branch-scoped workflow is verified explicitly. No
// formatter config, dependency, golden, gzip fixture or feature source is added
// by this helper. Only installed Biome 1.9.4 may format sources.
type FormatManifest = {
  schema: "pending-consumer-canonical-format/v1"
  repository: "tscircuit/core"
  stackBasePullRequest: 5625
  sourceCheckpointCommit: string
  publishManifestSha256: string
  publishManifestBase64: string
  biomeConfigSha256: string
  biomeVersion: "1.9.4"
  typescriptVersion: "5.9.3"
  additionalDiagnosticFiles: { path: string; sha256: string; bytes: number }[]
  diagnosticWorkflow: {
    path: ".github/workflows/core-consumer-format-capture.yml"
    sha256: string
    bytes: number
  }
  files: { path: string; beforeSha256: string; beforeBytes: number }[]
}
type AstNode = TypeScript.Node & Record<string, unknown>
type Primitive = string | number | boolean | null
type StructuralValue = Primitive | StructuralValue[] | {
  [key: string]: StructuralValue
}
type SavedSource = {
  path: string
  absolutePath: string
  before: Buffer
  beforeSha256: string
  beforeStructure: string
  kind: "typescript-ast" | "json-value"
}

const maximumOutputBytes = 2 * 1024 * 1024
const chunkCharacters = 16 * 1024
const marker = "PENDING_CONSUMER_FORMAT_V1"
const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex")

// These are parser locations, derived caches/aliases, or emission metadata.
// Language-specific scalar fields are retained by default. Unknown structured
// fields reject the proof rather than being silently discarded.
const parserMetadata = new Set([
  "pos", "end", "parent", "original", "emitNode", "id",
  "modifierFlagsCache", "transformFlags", "multiLine", "jsDoc", "jsDocCache",
  "symbol", "localSymbol", "locals", "nextContainer", "flowNode",
  "endFlowNode", "returnFlowNode",
])

function structuralAst(
  ts: typeof TypeScript,
  node: TypeScript.Node,
  source: TypeScript.SourceFile,
): StructuralValue {
  if (ts.isSourceFile(node)) {
    return {
      kind: node.kind,
      flags: node.flags,
      statements: Array.from(node.statements, (child) =>
        structuralAst(ts, child, source)),
      endOfFileToken: structuralAst(ts, node.endOfFileToken, source),
    }
  }
  const children = new Set<TypeScript.Node>()
  const childArrays = new Set<TypeScript.NodeArray<TypeScript.Node>>()
  ts.forEachChild(node, (child) => {
    children.add(child)
  }, (array) => {
    childArrays.add(array)
  })
  const result: { [key: string]: StructuralValue } = {}
  for (const key of Object.keys(node).sort()) {
    if (parserMetadata.has(key)) continue
    const value = (node as AstNode)[key]
    if (value === undefined) continue
    if (children.has(value as TypeScript.Node)) {
      result[key] = structuralAst(ts, value as TypeScript.Node, source)
    } else if (childArrays.has(value as TypeScript.NodeArray<TypeScript.Node>)) {
      result[key] = Array.from(value as TypeScript.NodeArray<TypeScript.Node>,
        (child) => structuralAst(ts, child, source))
    } else if (value === null || typeof value === "string" ||
      typeof value === "number" || typeof value === "boolean") {
      result[key] = value as Primitive
    } else {
      throw new Error(`Unclassified AST field ${ts.SyntaxKind[node.kind]}.${key}`)
    }
  }
  if (ts.isStringLiteral(node)) {
    // Permit a quote-delimiter change, but reject escape rewriting (including
    // accidental promotion of an escaped string into a "use strict" directive).
    const raw = node.getText(source)
    assert(raw[0] === '"' || raw[0] === "'")
    assert.equal(raw.at(-1), raw[0])
    result.rawStringBody = raw.slice(1, -1)
  }
  if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
    node.kind === ts.SyntaxKind.TemplateHead ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail) {
    // Tagged templates can observe raw escapes; decoded .text is insufficient.
    result.rawTemplateToken = node.getText(source)
  }
  return result
}

function preservedComments(
  ts: typeof TypeScript,
  source: TypeScript.SourceFile,
): StructuralValue {
  const leaves: { kind: number; start: number; end: number }[] = []
  const visit = (node: TypeScript.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode &&
      node.kind <= ts.SyntaxKind.LastJSDocNode) return
    const children = node.getChildren(source)
    if (children.length) {
      for (const child of children) visit(child)
    } else {
      const start = node.kind === ts.SyntaxKind.JsxText ? node.pos :
        node.getStart(source, false)
      if (node.end > start) leaves.push({ kind: node.kind, start, end: node.end })
    }
  }
  visit(source)
  leaves.sort((left, right) => left.start - right.start || left.end - right.end)
  const boundaries: StructuralValue[] = []
  let previousEnd = 0
  let tokenOrdinal = 0
  let boundary: StructuralValue[] = []
  let hasComment = false
  const flush = (): void => {
    if (hasComment) boundaries.push({ tokenOrdinal, items: boundary })
    boundary = []
    hasComment = false
  }
  for (const leaf of [...leaves,
    { kind: ts.SyntaxKind.EndOfFileToken, start: source.text.length,
      end: source.text.length }]) {
    assert(leaf.start >= previousEnd, "Overlapping parser token spans")
    // Only gaps between parser-token spans are scanned. A regexp, template, or
    // JSX text containing comment-like characters remains an indivisible leaf.
    const gap = source.text.slice(previousEnd, leaf.start)
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false,
      ts.LanguageVariant.Standard, gap)
    for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken;
      kind = scanner.scan()) {
      if (kind === ts.SyntaxKind.WhitespaceTrivia ||
        kind === ts.SyntaxKind.NewLineTrivia) continue
      assert(kind === ts.SyntaxKind.SingleLineCommentTrivia ||
        kind === ts.SyntaxKind.MultiLineCommentTrivia ||
        kind === ts.SyntaxKind.ShebangTrivia,
      `Unexpected nontrivia parser gap: ${ts.SyntaxKind[kind]}`)
      hasComment = true
      const text = scanner.getTokenText()
      const comment: { [key: string]: StructuralValue } = { kind, text }
      if (/@ts-(?:ignore|expect-error)\b/.test(text)) {
        // Moving a suppression onto/off the target code's line can change
        // typechecking despite an otherwise identical code AST and comment.
        comment.nextTokenLineDistance =
          source.getLineAndCharacterOfPosition(leaf.start).line -
          source.getLineAndCharacterOfPosition(
            previousEnd + scanner.getTextPos()).line
      }
      boundary.push(comment)
    }
    previousEnd = leaf.end
    if (leaf.kind === ts.SyntaxKind.CommaToken ||
      leaf.kind === ts.SyntaxKind.SemicolonToken) {
      // Unrelated trailing separators must not shift every later comment's
      // anchor. At a comment-bearing boundary their order is still preserved.
      boundary.push({ kind: leaf.kind })
    } else {
      flush()
      if (leaf.kind !== ts.SyntaxKind.EndOfFileToken) tokenOrdinal++
    }
  }
  return boundaries
}

function sourceStructure(
  ts: typeof TypeScript,
  path: string,
  bytes: Buffer,
): string {
  const text = bytes.toString("utf8")
  assert(Buffer.from(text, "utf8").equals(bytes), `Invalid UTF-8 in ${path}`)
  if (path.endsWith(".json")) {
    // Deep equality is checked separately as well (notably -0 versus 0).
    return JSON.stringify(JSON.parse(text))
  }
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const diagnostics = (source as TypeScript.SourceFile & {
    parseDiagnostics: readonly TypeScript.Diagnostic[]
  }).parseDiagnostics
  assert.equal(diagnostics.length, 0,
    `Parse diagnostics in ${path}: ${diagnostics.map((d) => d.code).join(",")}`)
  return JSON.stringify({ ast: structuralAst(ts, source, source),
    comments: preservedComments(ts, source) })
}

function git(repositoryRoot: string, args: string[]): Buffer {
  return execFileSync("git", args, { cwd: repositoryRoot,
    maxBuffer: maximumOutputBytes })
}

test("TEMP diagnostic: transport exact canonical Core consumer formatting", async () => {
  const repositoryRoot = realpathSync(process.cwd())
  const helperPath = realpathSync(fileURLToPath(import.meta.url))
  const manifestPath = realpathSync(fileURLToPath(new URL(
    "./core-consumer-format-capture.manifest.json", import.meta.url)))
  const manifestBytes = readFileSync(manifestPath)
  const manifest: FormatManifest = JSON.parse(manifestBytes.toString("utf8"))
  assert.equal(manifest.schema, "pending-consumer-canonical-format/v1")
  assert.equal(manifest.repository, "tscircuit/core")
  assert.equal(manifest.stackBasePullRequest, 5625)
  assert.match(manifest.sourceCheckpointCommit, /^[0-9a-f]{40}$/)
  assert.match(manifest.publishManifestSha256, /^[0-9a-f]{64}$/)
  assert.match(manifest.biomeConfigSha256, /^[0-9a-f]{64}$/)
  assert.equal(manifest.biomeVersion, "1.9.4")
  assert.equal(manifest.typescriptVersion, "5.9.3")
  assert(manifest.files.length > 0, "Checkpoint file list is not populated")
  const publishManifestBytes = Buffer.from(manifest.publishManifestBase64, "base64")
  assert.equal(publishManifestBytes.toString("base64"), manifest.publishManifestBase64)
  assert.equal(sha256(publishManifestBytes), manifest.publishManifestSha256)
  const published = JSON.parse(publishManifestBytes.toString("utf8")) as {
    repository: string
    productionFiles: { repositoryPath: string; bytes: number; sha256: string }[]
    testAndNativeVisualSources: {
      repositoryPath: string; bytes: number; sha256: string
    }[]
  }
  assert.equal(published.repository, manifest.repository)
  const publishedFiles = new Map<string, { bytes: number; sha256: string }>()
  for (const file of [...published.productionFiles,
    ...published.testAndNativeVisualSources]) {
    assert(!publishedFiles.has(file.repositoryPath),
      `Duplicate published source ${file.repositoryPath}`)
    publishedFiles.set(file.repositoryPath, file)
  }
  const helperRelative = relative(repositoryRoot, helperPath).split(sep).join("/")
  const manifestRelative = relative(repositoryRoot, manifestPath).split(sep).join("/")
  assert(!helperRelative.startsWith("../"))
  assert(!manifestRelative.startsWith("../"))
  git(repositoryRoot, ["merge-base", "--is-ancestor",
    manifest.sourceCheckpointCommit, "HEAD"])
  const diagnosticChanges = git(repositoryRoot, ["diff", "--name-only", "-z",
    manifest.sourceCheckpointCommit, "HEAD"]).toString("utf8").split("\0")
    .filter(Boolean)
  const diagnosticAllowlist = new Set([helperRelative, manifestRelative])
  const addedFiles = new Set(git(repositoryRoot, ["diff", "--diff-filter=A",
    "--name-only", "-z", manifest.sourceCheckpointCommit, "HEAD"])
    .toString("utf8").split("\0").filter(Boolean))
  for (const diagnostic of manifest.additionalDiagnosticFiles) {
    assert(diagnostic.path.startsWith("tests/") &&
      diagnostic.path.endsWith(".test.ts"))
    assert(!diagnostic.path.includes("\\"))
    assert.equal(diagnostic.path.split("/").filter((part) =>
      part === "" || part === "." || part === "..").length, 0)
    assert(!diagnosticAllowlist.has(diagnostic.path))
    assert(addedFiles.has(diagnostic.path),
      "Additional diagnostic helper must be newly added after checkpoint")
    assert.match(diagnostic.sha256, /^[0-9a-f]{64}$/)
    assert(Number.isSafeInteger(diagnostic.bytes) && diagnostic.bytes > 0)
    const diagnosticPath = resolve(repositoryRoot, diagnostic.path)
    assert(diagnosticPath.startsWith(repositoryRoot + sep))
    assert.equal(realpathSync(diagnosticPath), diagnosticPath)
    assert(lstatSync(diagnosticPath).isFile())
    const diagnosticBytes = readFileSync(diagnosticPath)
    assert.equal(diagnosticBytes.length, diagnostic.bytes)
    assert.equal(sha256(diagnosticBytes), diagnostic.sha256)
    assert(diagnosticBytes.equals(git(repositoryRoot,
      ["show", `HEAD:${diagnostic.path}`])))
    diagnosticAllowlist.add(diagnostic.path)
  }
  const workflow = manifest.diagnosticWorkflow
  assert.equal(workflow.path,
    ".github/workflows/core-consumer-format-capture.yml")
  assert(addedFiles.has(workflow.path))
  assert.match(workflow.sha256, /^[0-9a-f]{64}$/)
  assert(Number.isSafeInteger(workflow.bytes) && workflow.bytes > 0)
  const workflowPath = resolve(repositoryRoot, workflow.path)
  assert.equal(realpathSync(workflowPath), workflowPath)
  assert(lstatSync(workflowPath).isFile())
  const workflowBytes = readFileSync(workflowPath)
  assert.equal(workflowBytes.length, workflow.bytes)
  assert.equal(sha256(workflowBytes), workflow.sha256)
  assert(workflowBytes.equals(git(repositoryRoot,
    ["show", `HEAD:${workflow.path}`])))
  diagnosticAllowlist.add(workflow.path)
  assert(diagnosticChanges.every((path) => diagnosticAllowlist.has(path)),
  "Diagnostic branch changed checkpoint sources or configuration")
  const configPath = resolve(repositoryRoot, "biome.json")
  const configBefore = readFileSync(configPath)
  assert.equal(sha256(configBefore), manifest.biomeConfigSha256)
  assert(configBefore.equals(git(repositoryRoot,
    ["show", `${manifest.sourceCheckpointCommit}:biome.json`])))
  const require = createRequire(resolve(repositoryRoot, "package.json"))
  const ts = require("typescript") as typeof TypeScript
  assert.equal(ts.version, "5.9.3")
  const biomePackagePath = require.resolve("@biomejs/biome/package.json")
  const biomePackage = JSON.parse(readFileSync(biomePackagePath, "utf8"))
  assert.equal(biomePackage.name, "@biomejs/biome")
  assert.equal(biomePackage.version, "1.9.4")
  const biomeBin = resolve(dirname(biomePackagePath),
    typeof biomePackage.bin === "string" ? biomePackage.bin : biomePackage.bin.biome)
  const runBiome = (args: string[]): string =>
    execFileSync(process.execPath, [biomeBin, ...args], {
      cwd: repositoryRoot, encoding: "utf8", maxBuffer: maximumOutputBytes,
      stdio: ["ignore", "pipe", "pipe"],
    })
  const cliVersion = runBiome(["--version"]).trim()
  assert.match(cliVersion, /^Version:\s*1\.9\.4$/)
  const seen = new Set<string>()
  const saved: SavedSource[] = []
  for (const requested of manifest.files) {
    assert.equal(typeof requested.path, "string")
    assert(!requested.path.includes("\\"))
    assert.equal(requested.path.split("/").filter((part) =>
      part === "" || part === "." || part === "..").length, 0)
    assert(/\.(ts|tsx|json)$/.test(requested.path))
    assert(!requested.path.startsWith(".github/"))
    assert(!requested.path.split("/").some((part) =>
      part === ".git" || part === "node_modules"))
    assert(!/^(?:biome|package|tsconfig(?:\.[^.]+)?)\.json$/.test(
      basename(requested.path)), "Formatter/config manifests are outside source scope")
    assert(!seen.has(requested.path), `Duplicate source ${requested.path}`)
    seen.add(requested.path)
    assert.match(requested.beforeSha256, /^[0-9a-f]{64}$/)
    assert(Number.isSafeInteger(requested.beforeBytes) && requested.beforeBytes > 0)
    const publishedFile = publishedFiles.get(requested.path)
    assert(publishedFile, `${requested.path} is absent from refreshed publish manifest`)
    assert.equal(requested.beforeSha256, publishedFile.sha256)
    assert.equal(requested.beforeBytes, publishedFile.bytes)
    const absolutePath = resolve(repositoryRoot, requested.path)
    assert(absolutePath.startsWith(repositoryRoot + sep))
    assert.equal(realpathSync(absolutePath), absolutePath, "Symlink source rejected")
    assert(lstatSync(absolutePath).isFile())
    assert(absolutePath !== helperPath && absolutePath !== manifestPath)
    const before = readFileSync(absolutePath)
    assert.equal(before.length, requested.beforeBytes)
    assert.equal(sha256(before), requested.beforeSha256)
    assert(before.equals(git(repositoryRoot,
      ["show", `${manifest.sourceCheckpointCommit}:${requested.path}`])),
    `Source ${requested.path} differs from official checkpoint`)
    saved.push({ path: requested.path, absolutePath, before,
      beforeSha256: requested.beforeSha256,
      beforeStructure: sourceStructure(ts, requested.path, before),
      kind: requested.path.endsWith(".json") ? "json-value" : "typescript-ast" })
  }
  let verified = false
  try {
    // Only the canonical formatter is invoked: no lint/check unsafe fixes,
    // config overrides, alternate versions, or extra input paths.
    for (const source of saved) runBiome(["format", "--write", source.path])
    const header = { schema: manifest.schema, repository: manifest.repository,
      sourceCheckpointCommit: manifest.sourceCheckpointCommit,
      diagnosticHead: git(repositoryRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
      publishManifestSha256: manifest.publishManifestSha256,
      inputManifestSha256: sha256(manifestBytes),
      biomeConfigSha256: manifest.biomeConfigSha256,
      biomePackageVersion: biomePackage.version, biomeCliVersion: cliVersion,
      typescriptVersion: ts.version, fileCount: saved.length }
    const lines = [marker + "_BEGIN " + JSON.stringify(header)]
    let changedFiles = 0
    let rawBytes = 0
    let gzipBytes = 0
    for (const source of saved) {
      runBiome(["format", source.path])
      const after = readFileSync(source.absolutePath)
      const afterStructure = sourceStructure(ts, source.path, after)
      assert.equal(afterStructure, source.beforeStructure,
        `Structure/comment change in ${source.path}; formatted bytes rejected`)
      if (source.kind === "json-value") {
        assert.deepEqual(JSON.parse(after.toString("utf8")),
          JSON.parse(source.before.toString("utf8")))
      }
      const changed = !after.equals(source.before)
      if (changed) changedFiles++
      rawBytes += after.length
      const compressed = gzipSync(after, { level: 9 })
      assert(gunzipSync(compressed).equals(after))
      gzipBytes += compressed.length
      const encoded = compressed.toString("base64")
      const parts = Math.ceil(encoded.length / chunkCharacters)
      lines.push(marker + "_FILE " + JSON.stringify({ path: source.path,
        beforeSha256: source.beforeSha256, afterSha256: sha256(after),
        beforeBytes: source.before.length, afterBytes: after.length, changed,
        verification: source.kind, structureSha256: sha256(afterStructure),
        gzipSha256: sha256(compressed), gzipBytes: compressed.length,
        base64Characters: encoded.length, parts }))
      for (let part = 0; part < parts; part++) {
        const payload = encoded.slice(part * chunkCharacters,
          (part + 1) * chunkCharacters)
        lines.push(marker + "_CHUNK " + JSON.stringify({ path: source.path,
          part, parts, payloadSha256: sha256(payload), payload }))
      }
    }
    assert(readFileSync(configPath).equals(configBefore), "Biome config changed")
    const body = lines.join("\n") + "\n"
    const output = body + marker + "_END " + JSON.stringify({
      files: saved.length, changedFiles, rawBytes, gzipBytes,
      bodySha256: sha256(body) }) + "\n"
    assert(Buffer.byteLength(output, "utf8") <= maximumOutputBytes,
      "Complete formatted transport exceeds 2 MiB; no partial records emitted")
    assert.equal(await Bun.write(Bun.stdout, output),
      Buffer.byteLength(output, "utf8"))
    verified = true
  } finally {
    // Failed verification restores the exact bytes and remains a failed test.
    // No partial/unverified output is emitted or accepted as formatted source.
    if (!verified) {
      for (const source of saved) writeFileSync(source.absolutePath, source.before)
    }
  }
})
