#!/usr/bin/env bun

import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import ts from "typescript"

type RepositoryFilePath = string

export interface SourceRange {
  startLine: number
  endLine: number
}

const runGit = (args: string[]): string => {
  const result = spawnSync("git", args, { encoding: "utf8" })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`)
  }

  return result.stdout
}

export const getAddedLineNumbersByFilePath = (
  diff: string,
): Map<RepositoryFilePath, Set<number>> => {
  const addedLineNumbersByFilePath = new Map<RepositoryFilePath, Set<number>>()
  let currentFilePath: RepositoryFilePath | null = null
  let currentNewLineNumber: number | null = null

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const filePath = line.slice(4).replace(/^b\//, "")
      currentFilePath = filePath === "/dev/null" ? null : filePath
      currentNewLineNumber = null
      continue
    }

    const hunkHeaderMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkHeaderMatch) {
      currentNewLineNumber = Number(hunkHeaderMatch[1])
      continue
    }

    if (currentFilePath === null || currentNewLineNumber === null) continue

    if (line.startsWith("+")) {
      const addedLineNumbers =
        addedLineNumbersByFilePath.get(currentFilePath) ?? new Set<number>()
      addedLineNumbers.add(currentNewLineNumber)
      addedLineNumbersByFilePath.set(currentFilePath, addedLineNumbers)
      currentNewLineNumber++
    } else if (!line.startsWith("-") && !line.startsWith("\\")) {
      currentNewLineNumber++
    }
  }

  return addedLineNumbersByFilePath
}

export const findRawStringMapKeyRanges = (source: string): SourceRange[] => {
  const sourceFile = ts.createSourceFile(
    "source.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const ranges: SourceRange[] = []

  const visit = (node: ts.Node) => {
    const isMapTypeReference =
      ts.isTypeReferenceNode(node) &&
      ts.isIdentifier(node.typeName) &&
      node.typeName.text === "Map"
    const isMapConstructor =
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "Map"
    const typeArguments =
      isMapTypeReference || isMapConstructor ? node.typeArguments : undefined

    if (typeArguments?.[0]?.kind === ts.SyntaxKind.StringKeyword) {
      const start = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      )
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())
      ranges.push({ startLine: start.line + 1, endLine: end.line + 1 })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return ranges
}

export const findNewRawStringMapKeyLines = (
  source: string,
  addedLineNumbers: Set<number>,
): number[] =>
  findRawStringMapKeyRanges(source)
    .filter(({ startLine, endLine }) => {
      for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
        if (addedLineNumbers.has(lineNumber)) return true
      }
      return false
    })
    .map(({ startLine }) => startLine)

const main = () => {
  const baseRef = process.env.LINT_BASE_REF || "origin/main"
  const mergeBase = runGit(["merge-base", baseRef, "HEAD"]).trim()
  const diff = runGit([
    "diff",
    "--unified=0",
    "--no-color",
    "--diff-filter=ACMR",
    mergeBase,
    "--",
    "*.ts",
    "*.tsx",
    "*.mts",
    "*.cts",
  ])
  const addedLineNumbersByFilePath = getAddedLineNumbersByFilePath(diff)
  const violations: Array<{
    filePath: RepositoryFilePath
    lineNumber: number
  }> = []

  for (const [filePath, addedLineNumbers] of addedLineNumbersByFilePath) {
    const source = readFileSync(filePath, "utf8")
    for (const lineNumber of findNewRawStringMapKeyLines(
      source,
      addedLineNumbers,
    )) {
      violations.push({ filePath, lineNumber })
    }
  }

  if (violations.length === 0) {
    console.log("No new Map<string, ...> key types found.")
    return
  }

  for (const { filePath, lineNumber } of violations) {
    console.error(
      `${filePath}:${lineNumber}: Map<string, ...> is banned. Use a named or branded key type, such as Map<SchematicPortId, ...>.`,
    )
  }
  process.exitCode = 1
}

if (import.meta.main) main()
