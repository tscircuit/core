import { expect, test } from "bun:test"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import pkg from "../package.json"

const repoRoot = resolve(import.meta.dir, "..")

test("package.json exports a require condition so CJS modules can require('@tscircuit/core')", () => {
  const rootExport = pkg.exports["."] as Record<string, string>
  expect(rootExport.require).toBe("./dist/index.js")
  expect(rootExport.import).toBe("./dist/index.js")
  expect(rootExport.types).toBe("./dist/index.d.ts")

  // Verify CJS resolution against the actual package.json exports map using a
  // self-contained temp consumer so this test runs reliably even before dist/ is built.
  const tempDir = mkdtempSync(join(tmpdir(), "tscircuit-core-cjs-"))
  try {
    const pkgDir = join(tempDir, "node_modules", "@tscircuit", "core")
    mkdirSync(join(pkgDir, "dist"), { recursive: true })
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({
        name: pkg.name,
        type: pkg.type,
        main: pkg.main,
        exports: pkg.exports,
      }),
    )
    writeFileSync(
      join(pkgDir, "dist", "index.js"),
      "export const RootCircuit = function RootCircuit() {}; export const createUseComponent = function createUseComponent() {};\n",
    )

    const cjsFixture = join(tempDir, "consumer.cjs")
    writeFileSync(
      cjsFixture,
      "const core = require('@tscircuit/core'); module.exports = { hasRootCircuit: typeof core.RootCircuit === 'function', hasCreateUseComponent: typeof core.createUseComponent === 'function' };\n",
    )

    const requireFromTemp = createRequire(cjsFixture)
    const loaded = requireFromTemp(cjsFixture) as {
      hasRootCircuit: boolean
      hasCreateUseComponent: boolean
    }
    expect(loaded.hasRootCircuit).toBe(true)
    expect(loaded.hasCreateUseComponent).toBe(true)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }

  // When dist/index.js is built, also verify requiring the real built package.
  if (existsSync(join(repoRoot, "dist", "index.js"))) {
    const requireFromRepo = createRequire(join(repoRoot, "consumer.cjs"))
    const core = requireFromRepo("@tscircuit/core") as Record<string, unknown>
    expect(typeof core.RootCircuit).toBe("function")
    expect(typeof core.createUseComponent).toBe("function")
  }
})
