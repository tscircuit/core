import { readdirSync, readFileSync } from "node:fs"
import { resolve, relative } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { classExportExceptions } from "./class-export-exceptions"

/** Class implementation files get one export, including type-only exports.
 * Barrel files and utility modules without a top-level class are unaffected.
 */
export function getClassFileExports(fileName: string, source: string) {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  const hasClass = file.statements.some(
    (node) =>
      ts.isClassDeclaration(node) ||
      (ts.isVariableStatement(node) &&
        node.declarationList.declarations.some(
          (declaration) =>
            declaration.initializer &&
            ts.isClassExpression(declaration.initializer),
        )) ||
      (ts.isExportAssignment(node) && ts.isClassExpression(node.expression)),
  )
  if (!hasClass) return []

  const exports: { name: string; line: number }[] = []
  const add = (name: string, node: ts.Node) => {
    exports.push({
      name,
      line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
    })
  }
  const addBinding = (name: ts.BindingName) => {
    if (ts.isIdentifier(name)) add(name.text, name)
    else
      for (const element of name.elements) {
        if (!ts.isOmittedExpression(element)) addBinding(element.name)
      }
  }
  for (const node of file.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const specifier of node.exportClause.elements)
          add(specifier.name.text, specifier)
      } else {
        // A wildcard is forbidden alongside another export even if unresolved.
        add(node.exportClause?.name.text ?? "*", node)
      }
    } else if (ts.isExportAssignment(node)) {
      add(node.isExportEquals ? "export=" : "default", node)
    } else if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node)
      if (
        !modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      )
        continue
      if (
        modifiers.some(
          (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
        )
      )
        add("default", node)
      else if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations)
          addBinding(declaration.name)
      } else if (
        "name" in node &&
        node.name &&
        ts.isIdentifier(node.name as ts.Node)
      ) {
        add((node.name as ts.Identifier).text, node)
      }
    }
  }
  // Function overloads and declaration merging expose one exported name.
  return exports.filter(
    (entry, index) =>
      exports.findIndex((other) => other.name === entry.name) === index,
  )
}

export function checkClassExports(
  root: string,
  exceptions: typeof classExportExceptions = classExportExceptions,
) {
  const remainingExceptions = new Set(
    exceptions.flatMap(({ file, exports }) =>
      exports.map((name) => `${file}#${name}`),
    ),
  )
  const violations: string[] = []
  for (const path of readdirSync(resolve(root, "lib"), {
    recursive: true,
    encoding: "utf8",
  }).sort()) {
    if (!/\.[cm]?tsx?$/.test(path) || /\.d\.[cm]?ts$/.test(path)) continue
    const fileName = resolve(root, "lib", path)
    const relativePath = relative(root, fileName).replaceAll("\\", "/")
    const exports = getClassFileExports(
      fileName,
      readFileSync(fileName, "utf8"),
    )
    const allowedNames = new Set(
      exceptions
        .filter(({ file }) => file === relativePath)
        .flatMap(({ exports }) => exports),
    )
    const uncheckedExports = exports.filter(({ name }) => {
      if (!allowedNames.has(name)) return true
      remainingExceptions.delete(`${relativePath}#${name}`)
      return false
    })
    if (uncheckedExports.length > 1) {
      violations.push(
        `${relativePath}:${uncheckedExports[1]!.line}: Class files must have only one export; found ${exports.map(({ name }) => name).join(", ")}. Move extra exports to a separate module.`,
      )
    }
  }
  for (const exception of remainingExceptions) {
    violations.push(
      `${exception}: Stale class-export exception; remove it from scripts/class-export-exceptions.ts.`,
    )
  }
  return violations
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const violations = checkClassExports(
    fileURLToPath(new URL("../", import.meta.url)),
  )
  if (violations.length) {
    console.error(violations.join("\n"))
    process.exitCode = 1
  } else console.log("Class export check passed.")
}
