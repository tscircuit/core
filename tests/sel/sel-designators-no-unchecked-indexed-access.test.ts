import { test, expect } from "bun:test"
import path from "node:path"
import ts from "typescript"

test("sel designators 0..40 type-check with noUncheckedIndexedAccess", () => {
  const repoDir = path.join(import.meta.dir, "../..")
  const fixturePath = path.join(
    import.meta.dir,
    "fixtures/sel-designators-strict-usage.ts",
  )
  const { config } = ts.readConfigFile(
    path.join(repoDir, "tsconfig.json"),
    ts.sys.readFile,
  )
  const { options } = ts.convertCompilerOptionsFromJson(
    config.compilerOptions,
    repoDir,
  )
  const program = ts.createProgram({
    rootNames: [fixturePath],
    options: { ...options, noUncheckedIndexedAccess: true },
  })

  const diagnosticMessages = ts
    .getPreEmitDiagnostics(program, program.getSourceFile(fixturePath))
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    )

  expect(diagnosticMessages).toEqual([])
})
