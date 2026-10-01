import ts from "typescript"

type CaseCounts = {
  pass: number
  fail: number
  skip: number
  todo: number
  error: number
}

const emptyCounts = (): CaseCounts => ({
  pass: 0,
  fail: 0,
  skip: 0,
  todo: 0,
  error: 0,
})

/** Read explicit Bun deadlines without executing test source. */
export function declaredTestTimeoutMs(sourceText: string) {
  const source = ts.createSourceFile(
    "test.tsx",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const testNames = new Set(["test", "it"])
  const constants = new Map<string, number>()
  let maximumMs = 0
  const numericValue = (node: ts.Expression): number | undefined => {
    if (ts.isNumericLiteral(node)) return Number(node.text.replaceAll("_", ""))
    if (ts.isIdentifier(node)) return constants.get(node.text)
    return undefined
  }
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "bun:test"
    ) {
      const imports = node.importClause?.namedBindings
      if (imports && ts.isNamedImports(imports))
        for (const declaration of imports.elements) {
          if (
            ["test", "it"].includes(
              declaration.propertyName?.text ?? declaration.name.text,
            )
          )
            testNames.add(declaration.name.text)
        }
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const value = numericValue(node.initializer)
      if (value !== undefined) constants.set(node.name.text, value)
    }
    if (ts.isCallExpression(node) && node.arguments.length >= 3) {
      let callable: ts.Expression = node.expression
      while (
        ts.isPropertyAccessExpression(callable) ||
        ts.isCallExpression(callable)
      )
        callable = callable.expression
      if (ts.isIdentifier(callable) && testNames.has(callable.text)) {
        const options = node.arguments[2]
        let timeoutMs = numericValue(options)
        if (ts.isObjectLiteralExpression(options))
          for (const property of options.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              property.name.getText(source).replace(/["']/g, "") === "timeout"
            )
              timeoutMs = numericValue(property.initializer)
          }
        if (timeoutMs !== undefined && Number.isFinite(timeoutMs))
          maximumMs = Math.max(maximumMs, timeoutMs)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return maximumMs
}

export function parseBunTestLog(log: string) {
  const reached: string[] = []
  const caseCountsByFile: Record<string, CaseCounts> = {}
  let activeFile: string | undefined
  const plainLog = log.replace(/\u001b\[[0-9;]*m/g, "")
  for (const line of plainLog.split("\n")) {
    // Bun repeats skipped/failed cases in its terminal summary. Those lines
    // belong to the whole batch and must never attach to its final file.
    if (
      /^\s*\d+\s+tests?\s+(?:skipped|failed|todo):\s*$/.test(line) ||
      /^\s*\d+\s+(?:pass|fail|skip|todo|error)\s*$/.test(line) ||
      /^Ran \d+ tests? across \d+ files?\./.test(line) ||
      line === "--- stdout ---"
    )
      break
    const header = /^(?:\.\/)?(tests\/.+\.test\.(?:ts|tsx)):\s*$/.exec(line)
    if (header) {
      activeFile = header[1]
      reached.push(activeFile)
      caseCountsByFile[activeFile] = emptyCounts()
      continue
    }
    const status = /^\((pass|fail|skip|todo)\)\s/.exec(line)?.[1] as
      | keyof CaseCounts
      | undefined
    if (activeFile && status) caseCountsByFile[activeFile][status]++
    if (activeFile && /^#?\s*Unhandled error between tests/.test(line))
      caseCountsByFile[activeFile].error++
  }
  return { reached, caseCountsByFile }
}
