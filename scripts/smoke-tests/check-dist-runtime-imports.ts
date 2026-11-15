import { strict as assert } from "node:assert"
import { readFile, readdir } from "node:fs/promises"
import { builtinModules } from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import manifest from "../../package.json"

const builtinSpecifiers = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
])

const getPackageNameFromSpecifier = (specifier: string): string | null => {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    builtinSpecifiers.has(specifier)
  ) {
    return null
  }
  const segments = specifier.split("/")
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : (segments[0] ?? null)
}

const collectStaticModuleSpecifiers = (
  filename: string,
  sourceText: string,
): string[] => {
  const sourceFile = ts.createSourceFile(
    filename,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  )
  const specifiers: string[] = []

  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      specifiers.push(statement.moduleSpecifier.text)
    }
  }

  return specifiers
}

const declaredRuntimePackages = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
])

const distDir = fileURLToPath(new URL("../../dist", import.meta.url))
const distEntries = await readdir(distDir)
const undeclaredImportsByFile: string[] = []

for (const filename of distEntries.sort()) {
  if (!filename.endsWith(".js")) continue

  const filePath = fileURLToPath(
    new URL(`../../dist/${filename}`, import.meta.url),
  )
  const sourceText = await readFile(filePath, "utf8")
  const undeclaredPackages = new Set<string>()

  for (const specifier of collectStaticModuleSpecifiers(filename, sourceText)) {
    const packageName = getPackageNameFromSpecifier(specifier)
    if (packageName && !declaredRuntimePackages.has(packageName)) {
      undeclaredPackages.add(packageName)
    }
  }

  if (undeclaredPackages.size > 0) {
    undeclaredImportsByFile.push(
      `${filename}: ${[...undeclaredPackages].sort().join(", ")}`,
    )
  }
}

assert.deepEqual(
  undeclaredImportsByFile,
  [],
  `Built dist/*.js files contain static imports omitted from dependencies and peerDependencies:\n${undeclaredImportsByFile.join("\n")}`,
)

console.log(
  "All static runtime imports in dist/*.js are declared in dependencies or peerDependencies",
)
