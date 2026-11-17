import { expect, test } from "bun:test"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { relative } from "node:path"

// Temporary CI evidence only. The regular type-check workflow targets main;
// this runs its unchanged command on the actual stacked checkout, then leaves
// a digest of the tracked program excluding this transport-only test.
test("validate the canonical compiler on the stacked routing checkout", () => {
  const directory = process.cwd()
  const self = relative(directory, import.meta.path)
  const names = execFileSync("git", ["ls-files", "-z"], {
    cwd: directory,
    encoding: "utf8",
  })
    .split("\0")
    .filter((name) => name !== self && /\.(?:ts|tsx|json)$/.test(name))
    .sort()
  const hash = createHash("sha256")
  for (const name of names) {
    hash.update(name)
    hash.update("\0")
    hash.update(readFileSync(name))
    hash.update("\0")
  }
  const result = spawnSync("bunx", ["tsc", "--noEmit"], {
    cwd: directory,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.stdout.trim()) console.log(result.stdout)
  if (result.stderr.trim()) console.error(result.stderr)
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(0)
  const compiler = JSON.parse(
    readFileSync("node_modules/typescript/package.json", "utf8"),
  )
  console.log(
    "CORE_ROUTING_CANONICAL_TYPECHECK_PASS " +
      JSON.stringify({
        command: ["bunx", "tsc", "--noEmit"],
        compilerVersion: compiler.version,
        bunVersion: Bun.version,
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          cwd: directory,
          encoding: "utf8",
        }).trim(),
        sourceFileCount: names.length,
        sourceSha256: hash.digest("hex"),
        excludedTransportTest: self,
      }),
  )
}, 180_000)
