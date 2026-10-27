import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const solverPackage = "@tscircuit/test-point-rerouter"

// The source-only rerouter is a build-time dependency. Neither runtime code
// nor declarations may require consumers to install the source package.
for (const filename of ["index.js", "index.d.ts"]) {
  const distPath = fileURLToPath(
    new URL(`../../dist/${filename}`, import.meta.url),
  )
  const source = await readFile(distPath, "utf8")
  const { importedFiles } = ts.preProcessFile(source, true, true)
  const solverImports = importedFiles.filter(
    ({ fileName }) =>
      fileName === solverPackage || fileName.startsWith(`${solverPackage}/`),
  )

  if (solverImports.length > 0) {
    throw new Error(
      `${filename} still requires ${solverPackage}; bundle its JavaScript and types`,
    )
  }
}

console.log("Test-point rerouter is bundled in Core's JavaScript and types")
