import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("package.json exports '.' includes a default fallback condition so CJS/require(esm) resolvers do not fail with ERR_PACKAGE_PATH_NOT_EXPORTED", () => {
  const pkgJsonPath = path.resolve(import.meta.dir, "../package.json")
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"))

  expect(pkgJson.exports?.["."]).toEqual({
    types: "./dist/index.d.ts",
    import: "./dist/index.js",
    default: "./dist/index.js",
  })
})
