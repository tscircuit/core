import { expect, test } from "bun:test"
import {
  findNewRawStringMapKeyLines,
  findRawStringMapKeyRanges,
  getAddedLineNumbersByFilePath,
} from "../../scripts/check-for-new-map-string-keys"

test("finds raw string Map keys but ignores comments and strings", () => {
  const source = [
    "const good = new Map<SchematicPortId, Port>()",
    "const bad = new " + "Map<string, Port>()",
    "// " + "Map<string, Port>() is only documentation",
    'const example = "' + "Map<string, Port>()" + '"',
  ].join("\n")

  expect(findRawStringMapKeyRanges(source)).toEqual([
    { startLine: 2, endLine: 2 },
  ])
})

test("finds a multiline raw string Map key when any of its lines are added", () => {
  const source = ["const ports = new Map<", "  string,", "  Port", ">()"].join(
    "\n",
  )

  expect(findNewRawStringMapKeyLines(source, new Set([2]))).toEqual([1])
})

test("parses added line numbers from a zero-context git diff", () => {
  const diff = [
    "diff --git a/lib/example.ts b/lib/example.ts",
    "--- a/lib/example.ts",
    "+++ b/lib/example.ts",
    "@@ -1,0 +2,2 @@",
    "+const ports = new " + "Map<string, Port>()",
    "+usePorts(ports)",
  ].join("\n")

  expect([
    ...getAddedLineNumbersByFilePath(diff).get("lib/example.ts")!,
  ]).toEqual([2, 3])
})
