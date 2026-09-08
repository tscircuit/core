import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../package.json",
)

test("package exports include a require condition so CJS registry packages can load core", () => {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"))

  expect(pkg.exports["."].require).toBe("./dist/index.js")
})
