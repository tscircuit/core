import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const source = resolve(process.argv[2] ?? "")
const expected = "1975652b039564919f757431f6967d4b48ac32cb"
const git = (args) => execFileSync("git", args, { cwd: source, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
const sha = (algorithm, bytes) => createHash(algorithm).update(bytes).digest("hex")
assert.equal(git(["rev-parse", "HEAD"]).trim(), expected)
assert.equal(Bun.version, "1.4.2")
const require = createRequire(resolve(source, "package.json"))
const ts = require("typescript")
assert.equal(ts.version, "5.9.3")
const entries = git(["ls-tree", "-rz", "--full-tree", "HEAD"]).split("\0").filter(Boolean).map((row) => {
  const separator = row.indexOf("\t")
  const [mode, kind, blob] = row.slice(0, separator).split(" ")
  return { mode, kind, blob, path: row.slice(separator + 1) }
}).filter((entry) => entry.kind === "blob" && /\.(?:ts|tsx|json)$/.test(entry.path)).sort((a, b) => a.path.localeCompare(b.path))
const fingerprint = () => {
  const hash = createHash("sha256")
  for (const entry of entries) {
    const bytes = readFileSync(resolve(source, entry.path))
    assert.equal(sha("sha1", Buffer.concat([Buffer.from("blob " + bytes.length + "\0"), bytes])), entry.blob, "Tracked source changed: " + entry.path)
    hash.update(entry.path + "\0" + sha("sha256", bytes) + "\n")
  }
  return hash.digest("hex")
}
const before = fingerprint()
git(["diff", "--exit-code", "HEAD", "--", ".", ":(exclude)bun.lock", ":(exclude)bun.lockb"])
const compiler = require.resolve("typescript")
console.log("CORE_CONSUMER_TYPECHECK_START " + JSON.stringify({ sourceHead: expected, sourceFiles: entries.length, sourceSha256: before, bun: Bun.version, typescript: ts.version, compilerSha256: sha("sha256", readFileSync(compiler)), declaredBus: require("./package.json").devDependencies["@tscircuit/bus-lanes-solver"] }))
execFileSync("bunx", ["tsc", "--noEmit"], { cwd: source, stdio: "inherit", timeout: 900000, maxBuffer: 4 * 1024 * 1024 })
assert.equal(fingerprint(), before)
git(["diff", "--exit-code", "HEAD", "--", ".", ":(exclude)bun.lock", ":(exclude)bun.lockb"])
console.log("CORE_CONSUMER_CANONICAL_TYPECHECK_PASS " + JSON.stringify({ sourceHead: expected, sourceFiles: entries.length, sourceSha256: before, bun: Bun.version, typescript: ts.version, exactSourceCheckout: true, captureFilesOutsideCompilerCheckout: true }))
