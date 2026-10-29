import { expect, test } from "bun:test"
import { Glob } from "bun"
import ts from "typescript"

test("normal component class files export only their class at runtime", async () => {
  const violations: string[] = []
  for await (const path of new Glob(
    "lib/components/normal-components/**/*.ts",
  ).scan({ cwd: import.meta.dir + "/../..", absolute: true })) {
    const source = ts.createSourceFile(
      path,
      await Bun.file(path).text(),
      ts.ScriptTarget.Latest,
      true,
    )
    if (!source.statements.some(ts.isClassDeclaration)) continue

    // Type-only exports do not introduce shared runtime helpers into class files.
    const runtimeExports = source.statements.filter((statement) => {
      if (
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement)
      )
        return false
      if (ts.isExportDeclaration(statement)) {
        return (
          !statement.isTypeOnly &&
          (!statement.exportClause ||
            !ts.isNamedExports(statement.exportClause) ||
            statement.exportClause.elements.some(
              (element) => !element.isTypeOnly,
            ))
        )
      }
      return (
        ts.isExportAssignment(statement) ||
        (ts.canHaveModifiers(statement) &&
          ts
            .getModifiers(statement)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
      )
    })
    if (
      runtimeExports.length !== 1 ||
      !ts.isClassDeclaration(runtimeExports[0]!)
    ) {
      violations.push(path)
    }
  }
  expect(violations).toEqual([])
})
