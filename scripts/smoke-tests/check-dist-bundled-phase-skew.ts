import { readFile } from "node:fs/promises"
import ts from "typescript"

const phaseSkewPackage = "compute-differential-pair-phase-skew"

for (const filename of ["index.js", "index.d.ts"]) {
  const source = await readFile(
    new URL(`../../dist/${filename}`, import.meta.url),
    "utf8",
  )
  const { importedFiles } = ts.preProcessFile(source, true, true)
  const importsPhaseSkew = importedFiles.some(
    ({ fileName }) =>
      fileName === phaseSkewPackage ||
      fileName.startsWith(`${phaseSkewPackage}/`),
  )

  if (importsPhaseSkew) {
    throw new Error(
      `${filename} still requires ${phaseSkewPackage}; bundle its JavaScript and types`,
    )
  }
}

console.log("Phase skew is bundled in Core's JavaScript and types")
