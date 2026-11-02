import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// Use only the packed package's declared runtime dependencies. A smoke test in
// the Core checkout can accidentally resolve imports from its devDependencies.
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const temporary = mkdtempSync(join(tmpdir(), "core-packed-cable-inference-"))
try {
  const packed = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
      { cwd: repository, encoding: "utf8", timeout: 60_000 },
    ),
  )[0]
  const published = JSON.parse(
    readFileSync(join(repository, "package.json"), "utf8"),
  )
  assert.ok(
    packed.files.some(({ path }) => path === "dist/index.js"),
    "Build Core before testing its packed consumer",
  )
  writeFileSync(
    join(temporary, "package.json"),
    JSON.stringify({
      name: "core-packed-import-reproduction",
      private: true,
      type: "module",
      dependencies: { [published.name]: `file:${join(temporary, packed.filename)}` },
    }),
  )
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: temporary,
    stdio: "inherit",
    timeout: 180_000,
  })
  // Isolate this dependency from unrelated undeclared imports in Core. Resolve
  // it with ESM from inside the installed Core package, as its bundle does.
  const probe = join(
    temporary,
    "node_modules",
    published.name,
    "dist",
    "cable-inference-probe.mjs",
  )
  writeFileSync(probe, `
    import assert from "node:assert/strict";
    import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point";
    assert.equal(typeof guessCableInsertCenter, "function");
    console.log("Packed Core can resolve its cable-inference runtime import");
  `)
  execFileSync(process.execPath, [probe], {
    cwd: temporary,
    stdio: "inherit",
    timeout: 30_000,
  })
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
