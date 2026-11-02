import { strict as assert } from "node:assert"
import { readFile } from "node:fs/promises"
import ts from "typescript"
import manifest from "../../package.json"

// Keep tscircuit's packed-install dependency guarantee intact. A development
// tool may use manifold-3d, but consumers of the published core must not need it.
for (const kind of [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
] as const) {
  const dependencies = (manifest as Record<string, unknown>)[kind] as
    | Record<string, string>
    | undefined
  assert.equal(dependencies?.["manifold-3d"], undefined)
}

const declarations = await readFile(
  new URL("../../dist/index.d.ts", import.meta.url),
  "utf8",
)
const { importedFiles } = ts.preProcessFile(declarations, true, true)
assert.ok(
  !importedFiles.some(
    ({ fileName }) =>
      fileName === "manifold-3d" || fileName.startsWith("manifold-3d/"),
  ),
  "Core declarations must not require manifold-3d",
)
console.log(
  "Core's production manifest and public declarations do not require manifold-3d",
)
