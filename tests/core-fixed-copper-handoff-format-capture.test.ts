import assert from "node:assert/strict"
import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { basename, dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync, gunzipSync } from "node:zlib"
import { test } from "bun:test"
import type * as TypeScript from "typescript"

// TEMPORARY DIAGNOSTIC ONLY. Copy this file and its companion manifest to the
// checkpoint's tests directory on a disposable branch. The manifest must come
// from the refreshed official publish manifest, never from this older workspace.
// No workflow, formatter config, dependency, golden, gzip fixture, or feature-PR
// file is added by this helper. Only installed Biome 1.9.4 may format sources.
type FormatManifest = {
  schema: "pending-consumer-canonical-format/v1"
  repository: "tscircuit/core"
  stackBaseCommit: string
  sourceCheckpointCommit: string
  publishManifestSha256: string
  publishManifestBase64: string
  biomeConfigSha256: string
  biomeVersion: "1.9.4"
  typescriptVersion: "5.9.3"
  additionalDiagnosticFiles: { path: string; sha256: string; bytes: number }[]
  files: { path: string; beforeSha256: string; beforeBytes: number }[]
  immutableFiles: { path: string; sha256: string; bytes: number; gitBlobSha1: string }[]
}
type AstNode = TypeScript.Node & Record<string, unknown>
type Primitive = string | number | boolean | null
type StructuralValue = Primitive | StructuralValue[] | {
  [key: string]: StructuralValue
}
type SavedSource = {
  path: string
  absolutePath: string
  before: Buffer
  beforeSha256: string
  beforeStructure: string
  kind: "typescript-ast" | "json-value"
}

const maximumOutputBytes = 2 * 1024 * 1024
const chunkCharacters = 16 * 1024
const marker = "PENDING_CONSUMER_FORMAT_V1"
const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex")

// These are parser locations, derived caches/aliases, or emission metadata.
// Language-specific scalar fields are retained by default. Unknown structured
// fields reject the proof rather than being silently discarded.
const parserMetadata = new Set([
  "pos", "end", "parent", "original", "emitNode", "id",
  "modifierFlagsCache", "transformFlags", "multiLine", "jsDoc", "jsDocCache",
  "symbol", "localSymbol", "locals", "nextContainer", "flowNode",
  "endFlowNode", "returnFlowNode",
])

// A formatter may surround the entire value of a return statement with
// parentheses to wrap it across lines. Only this outer chain is transparent:
// parentheses inside calls, optional chains, directives, and operators retain
// their exact AST representation.
function returnValue(
  ts: typeof TypeScript,
  node: TypeScript.ReturnStatement,
): TypeScript.Expression | undefined {
  let expression = node.expression
  while (expression && ts.isParenthesizedExpression(expression)) {
    expression = expression.expression
  }
  return expression
}

// Exponentiation binds more tightly than bitwise AND, OR, or XOR. Biome may
// add readability parentheses to exactly that right-hand expression. Preserve
// all grouping inside the exponentiation, including its associativity.
function bitwiseExponentValue(
  ts: typeof TypeScript,
  node: TypeScript.BinaryExpression,
): TypeScript.Expression | undefined {
  if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandToken &&
    node.operatorToken.kind !== ts.SyntaxKind.BarToken &&
    node.operatorToken.kind !== ts.SyntaxKind.CaretToken) return undefined
  let expression = node.right
  while (ts.isParenthesizedExpression(expression)) expression = expression.expression
  return ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskToken
    ? expression : undefined
}

// *, / and % are left-associative at the same precedence. A wrapper around
// their already-left child changes no grouping, evaluation order or IEEE-754
// operation order. Right operands and every inner grouping remain untouched.
function multiplicativeLeftValue(
  ts: typeof TypeScript,
  node: TypeScript.BinaryExpression,
): TypeScript.Expression | undefined {
  const multiplicative = (kind: TypeScript.SyntaxKind): boolean =>
    kind === ts.SyntaxKind.AsteriskToken || kind === ts.SyntaxKind.SlashToken ||
    kind === ts.SyntaxKind.PercentToken
  if (!multiplicative(node.operatorToken.kind)) return undefined
  let expression = node.left
  while (ts.isParenthesizedExpression(expression)) expression = expression.expression
  return ts.isBinaryExpression(expression) && multiplicative(expression.operatorToken.kind)
    ? expression : undefined
}

function optionalArrowParameter(
  ts: typeof TypeScript,
  node: TypeScript.ArrowFunction,
): boolean {
  if (node.parameters.length !== 1 ||
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) return false
  const parameter = node.parameters[0]
  return ts.isIdentifier(parameter.name) && !parameter.type && !parameter.questionToken &&
    !parameter.dotDotDotToken && !parameter.initializer && !parameter.modifiers?.length
}

// In a generator, TypeScript 5.9.3 parses `x => x` with YieldContext on
// the parameter and its identifier, but `(x) => x` without that context bit.
// Binding consults these bits for the reserved names yield/await; exclude both
// decoded names, async arrows and every non-simple parameter. Only this exact
// parser artifact is transparent. Arrow/body flags and all other flags survive.
function generatorArrowParameterFlags(
  ts: typeof TypeScript,
  node: TypeScript.Node,
): TypeScript.NodeFlags {
  const parameter = ts.isParameter(node) ? node
    : ts.isIdentifier(node) && ts.isParameter(node.parent) && node.parent.name === node
      ? node.parent : undefined
  if (!parameter || !ts.isIdentifier(parameter.name) ||
    parameter.name.text === "yield" || parameter.name.text === "await") return node.flags
  const arrow = parameter.parent
  if (!ts.isArrowFunction(arrow) || !optionalArrowParameter(ts, arrow) ||
    arrow.flags !== ts.NodeFlags.YieldContext ||
    (node.flags !== 0 && node.flags !== ts.NodeFlags.YieldContext)) return node.flags
  let boundary: TypeScript.Node | undefined = arrow.parent
  while (boundary && !ts.isFunctionLike(boundary)) boundary = boundary.parent
  if (!boundary || !(ts.isFunctionDeclaration(boundary) ||
    ts.isFunctionExpression(boundary) || ts.isMethodDeclaration(boundary)) ||
    !boundary.asteriskToken ||
    boundary.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) return node.flags
  return ts.NodeFlags.None
}

// TypeScript 5.9.3's ReactJSX transform emits no child expression for
// entirely ASCII indentation text containing a line break. Same-line spaces,
// entities, Unicode whitespace, nonempty text and JSX expressions stay exact.
function isEmptyJsxIndentation(
  ts: typeof TypeScript,
  node: TypeScript.Node,
): boolean {
  return ts.isJsxText(node) &&
    (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
    /[\r\n]/.test(node.text) && /^[ \t\r\n]+$/.test(node.text)
}

function blockStatements(
  ts: typeof TypeScript,
  request: { block: TypeScript.Block; source: TypeScript.SourceFile },
): readonly TypeScript.Statement[] {
  const { block, source } = request
  return block.statements.filter((statement, index) => {
    if (!ts.isEmptyStatement(statement)) return true
    const next = block.statements[index + 1]
    if (!next || !ts.isExpressionStatement(next) ||
      !ts.isBinaryExpression(next.expression) ||
      next.expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
      next.expression.getFirstToken(source)?.kind !== ts.SyntaxKind.OpenParenToken) return true
    // This standalone no-op is followed by an assignment, which cannot be a
    // directive. Empty loop/if/labeled bodies are different AST roles and are
    // never removed. A prologue string following an empty remains significant.
    return false
  })
}

function structuralAst(
  ts: typeof TypeScript,
  node: TypeScript.Node,
  source: TypeScript.SourceFile,
): StructuralValue {
  if (ts.isSourceFile(node)) {
    return {
      kind: node.kind,
      flags: node.flags,
      statements: Array.from(node.statements, (child) =>
        structuralAst(ts, child, source)),
      endOfFileToken: structuralAst(ts, node.endOfFileToken, source),
    }
  }
  const children = new Set<TypeScript.Node>()
  const childArrays = new Set<TypeScript.NodeArray<TypeScript.Node>>()
  ts.forEachChild(node, (child) => {
    children.add(child)
  }, (array) => {
    childArrays.add(array)
  })
  const result: { [key: string]: StructuralValue } = {}
  for (const key of Object.keys(node).sort()) {
    if (parserMetadata.has(key)) continue
    const value = (node as AstNode)[key]
    if (value === undefined) continue
    if (children.has(value as TypeScript.Node)) {
      const child = ts.isReturnStatement(node) && key === "expression"
        ? returnValue(ts, node)
        : ts.isBinaryExpression(node) && key === "right"
          ? bitwiseExponentValue(ts, node) ?? value as TypeScript.Node
        : ts.isBinaryExpression(node) && key === "left"
          ? multiplicativeLeftValue(ts, node) ?? value as TypeScript.Node
        : value as TypeScript.Node
      assert(child)
      result[key] = structuralAst(ts, child, source)
    } else if (childArrays.has(value as TypeScript.NodeArray<TypeScript.Node>)) {
      const nodes = ts.isBlock(node) && key === "statements"
        ? blockStatements(ts, { block: node, source })
        : (ts.isJsxElement(node) || ts.isJsxFragment(node)) && key === "children"
          ? node.children.filter((child) => !isEmptyJsxIndentation(ts, child))
          : value as TypeScript.NodeArray<TypeScript.Node>
      result[key] = Array.from(nodes,
        (child) => structuralAst(ts, child, source))
    } else if (value === null || typeof value === "string" ||
      typeof value === "number" || typeof value === "boolean") {
      result[key] = key === "flags" ? generatorArrowParameterFlags(ts, node) : value as Primitive
    } else {
      throw new Error(`Unclassified AST field ${ts.SyntaxKind[node.kind]}.${key}`)
    }
  }
  if (ts.isStringLiteral(node)) {
    // Permit a quote-delimiter change, but reject escape rewriting (including
    // accidental promotion of an escaped string into a "use strict" directive).
    const raw = node.getText(source)
    assert(raw[0] === '"' || raw[0] === "'")
    assert.equal(raw.at(-1), raw[0])
    result.rawStringBody = raw.slice(1, -1)
  }
  if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
    node.kind === ts.SyntaxKind.TemplateHead ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail) {
    // Tagged templates can observe raw escapes; decoded .text is insufficient.
    result.rawTemplateToken = node.getText(source)
  }
  return result
}

function preservedComments(
  ts: typeof TypeScript,
  source: TypeScript.SourceFile,
): StructuralValue {
  const leaves: { kind: number; start: number; end: number }[] = []
  const transparentExpressionParentheses = new Set<number>()
  const leadingTypeOperators = new Set<number>()
  const transparentJsxIndentation = new Set<number>()
  const visit = (node: TypeScript.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode &&
      node.kind <= ts.SyntaxKind.LastJSDocNode) return
    if (isEmptyJsxIndentation(ts, node)) transparentJsxIndentation.add(node.pos)
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
      const first = node.getFirstToken(source)
      if (first?.kind === ts.SyntaxKind.BarToken ||
        first?.kind === ts.SyntaxKind.AmpersandToken) {
        leadingTypeOperators.add(first.getStart(source))
      }
    }
    if (ts.isReturnStatement(node)) {
      let expression = node.expression
      while (expression && ts.isParenthesizedExpression(expression)) {
        const open = expression.getFirstToken(source)
        const close = expression.getLastToken(source)
        assert(open?.kind === ts.SyntaxKind.OpenParenToken)
        assert(close?.kind === ts.SyntaxKind.CloseParenToken)
        transparentExpressionParentheses.add(open.getStart(source))
        transparentExpressionParentheses.add(close.getStart(source))
        expression = expression.expression
      }
    }
    if (ts.isBinaryExpression(node) && bitwiseExponentValue(ts, node)) {
      let expression = node.right
      while (ts.isParenthesizedExpression(expression)) {
        const open = expression.getFirstToken(source)
        const close = expression.getLastToken(source)
        assert(open?.kind === ts.SyntaxKind.OpenParenToken)
        assert(close?.kind === ts.SyntaxKind.CloseParenToken)
        transparentExpressionParentheses.add(open.getStart(source))
        transparentExpressionParentheses.add(close.getStart(source))
        expression = expression.expression
      }
    }
    if (ts.isBinaryExpression(node) && multiplicativeLeftValue(ts, node)) {
      let expression = node.left
      while (ts.isParenthesizedExpression(expression)) {
        const open = expression.getFirstToken(source)
        const close = expression.getLastToken(source)
        assert(open?.kind === ts.SyntaxKind.OpenParenToken)
        assert(close?.kind === ts.SyntaxKind.CloseParenToken)
        transparentExpressionParentheses.add(open.getStart(source))
        transparentExpressionParentheses.add(close.getStart(source))
        expression = expression.expression
      }
    }
    if (ts.isArrowFunction(node) && optionalArrowParameter(ts, node)) {
      for (const child of node.getChildren(source)) {
        if (child.kind === ts.SyntaxKind.OpenParenToken ||
          child.kind === ts.SyntaxKind.CloseParenToken) {
          transparentExpressionParentheses.add(child.getStart(source))
        }
      }
    }
    const children = node.getChildren(source)
    if (children.length) {
      for (const child of children) visit(child)
    } else {
      const start = node.kind === ts.SyntaxKind.JsxText ? node.pos :
        node.getStart(source, false)
      if (node.end > start) leaves.push({ kind: node.kind, start, end: node.end })
    }
  }
  visit(source)
  leaves.sort((left, right) => left.start - right.start || left.end - right.end)
  const boundaries: StructuralValue[] = []
  let previousEnd = 0
  let tokenOrdinal = 0
  let boundary: StructuralValue[] = []
  let hasComment = false
  const flush = (): void => {
    if (hasComment) boundaries.push({ tokenOrdinal, items: boundary })
    boundary = []
    hasComment = false
  }
  const withEof = [...leaves,
    { kind: ts.SyntaxKind.EndOfFileToken, start: source.text.length,
      end: source.text.length }]
  for (let index = 0; index < withEof.length; index++) {
    const leaf = withEof[index]
    assert(leaf.start >= previousEnd, "Overlapping parser token spans")
    // Only gaps between parser-token spans are scanned. A regexp, template, or
    // JSX text containing comment-like characters remains an indivisible leaf.
    const gap = source.text.slice(previousEnd, leaf.start)
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false,
      ts.LanguageVariant.Standard, gap)
    for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken;
      kind = scanner.scan()) {
      if (kind === ts.SyntaxKind.WhitespaceTrivia ||
        kind === ts.SyntaxKind.NewLineTrivia) continue
      assert(kind === ts.SyntaxKind.SingleLineCommentTrivia ||
        kind === ts.SyntaxKind.MultiLineCommentTrivia ||
        kind === ts.SyntaxKind.ShebangTrivia,
      `Unexpected nontrivia parser gap: ${ts.SyntaxKind[kind]}`)
      hasComment = true
      const text = scanner.getTokenText()
      const comment: { [key: string]: StructuralValue } = { kind, text }
      if (/@ts-(?:ignore|expect-error)\b/.test(text)) {
        // Moving a suppression onto/off the target code's line can change
        // typechecking despite an otherwise identical code AST and comment.
        let targetIndex = index
        while (transparentExpressionParentheses.has(withEof[targetIndex].start)) {
          targetIndex++
        }
        comment.nextTokenLineDistance =
          source.getLineAndCharacterOfPosition(withEof[targetIndex].start).line -
          source.getLineAndCharacterOfPosition(
            previousEnd + scanner.getTextPos()).line
      }
      boundary.push(comment)
    }
    previousEnd = leaf.end
    // Do not shift comment anchors for the same transparent return wrappers.
    // Comments before and inside a wrapper still anchor to the same next
    // significant token, and suppression line distances remain checked.
    if (transparentExpressionParentheses.has(leaf.start) ||
      transparentJsxIndentation.has(leaf.start)) continue
    if (leadingTypeOperators.has(leaf.start) ||
      leaf.kind === ts.SyntaxKind.CommaToken ||
      leaf.kind === ts.SyntaxKind.SemicolonToken) {
      // Unrelated trailing separators must not shift every later comment's
      // anchor. At a comment-bearing boundary their order is still preserved.
      boundary.push({ kind: leaf.kind })
    } else {
      flush()
      if (leaf.kind !== ts.SyntaxKind.EndOfFileToken) tokenOrdinal++
    }
  }
  return boundaries
}

function sourceStructure(
  ts: typeof TypeScript,
  path: string,
  bytes: Buffer,
): string {
  const text = bytes.toString("utf8")
  assert(Buffer.from(text, "utf8").equals(bytes), `Invalid UTF-8 in ${path}`)
  if (path.endsWith(".json")) {
    // Deep equality is checked separately as well (notably -0 versus 0).
    return JSON.stringify(JSON.parse(text))
  }
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const diagnostics = (source as TypeScript.SourceFile & {
    parseDiagnostics: readonly TypeScript.Diagnostic[]
  }).parseDiagnostics
  assert.equal(diagnostics.length, 0,
    `Parse diagnostics in ${path}: ${diagnostics.map((d) => d.code).join(",")}`)
  return JSON.stringify({ ast: structuralAst(ts, source, source),
    comments: preservedComments(ts, source) })
}

function reactJsxRuntimeStructure(
  ts: typeof TypeScript,
  path: string,
  bytes: Buffer,
): string {
  const emitted = ts.transpileModule(bytes.toString("utf8"), {
    fileName: path, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX, moduleDetection: ts.ModuleDetectionKind.Force,
      removeComments: false },
  })
  assert.equal(emitted.diagnostics?.length ?? 0, 0, "ReactJSX transpilation diagnostics")
  return sourceStructure(ts, path + ".runtime.ts", Buffer.from(emitted.outputText))
}

export function verifyReturnParenthesesNormalization(ts: typeof TypeScript): void {
  const structure = (text: string): string =>
    sourceStructure(ts, "return-parentheses-proof.ts", Buffer.from(text))
  const equal = (before: string, after: string): void =>
    assert.equal(structure(before), structure(after))
  const different = (before: string, after: string): void =>
    assert.notEqual(structure(before), structure(after))

  equal("function f() { return !a || b !== 1 || c !== d; /* after */ }",
    "function f() { return (\n !a || b !== 1 || c !== d\n ); /* after */ }")
  equal("function f() { return (a, b); }",
    "function f() { return (((a, b))); }")
  equal("function f() { return a?.b; }", "function f() { return (a?.b); }")
  equal("function f() { return /* keep */ a; }",
    "function f() { return (/* keep */ a); }")
  equal("function f() { return /* @ts-ignore */ a; }",
    "function f() { return (/* @ts-ignore */ a); }")
  equal("type T = A | B; /* after */ type U = C;",
    "type T =\n | A\n | B; /* after */ type U = C;")
  equal("type T = A & B; /* after */ type U = C;",
    "type T =\n & A\n & B; /* after */ type U = C;")
  different("type T = A | B; /* after */ type U = C;",
    "type T = A & B; /* after */ type U = C;")
  different("type T = /* keep */ A | B;",
    "type T = A | /* keep */ B;")
  equal("function f() { return mask & 2 ** index; /* after */ }",
    "function f() { return mask & (2 ** index); /* after */ }")
  equal("function f() { return mask | 2 ** index; /* after */ }",
    "function f() { return mask | (2 ** index); /* after */ }")
  equal("function f() { return mask ^ 2 ** index; /* after */ }",
    "function f() { return mask ^ (2 ** index); /* after */ }")
  different("function f() { return mask & (2 ** index + 1); }",
    "function f() { return (mask & 2 ** index) + 1; }")
  different("function f() { return mask & ((2 ** index) ** next); }",
    "function f() { return mask & (2 ** (index ** next)); }")
  equal("function f() { return a * b / c; /* after */ }",
    "function f() { return (a * b) / c; /* after */ }")
  equal("function f() { return a / b * c; }",
    "function f() { return (a / b) * c; }")
  equal("function f() { return a % b / c; }",
    "function f() { return (a % b) / c; }")
  equal("function f() { return (a + b) * c / d; }",
    "function f() { return ((a + b) * c) / d; }")
  different("function f() { return a * (b / c); }",
    "function f() { return (a * b) / c; }")
  different("function f() { return a / (b * c); }",
    "function f() { return (a / b) * c; }")
  different("function f() { return (a + b) * c; }",
    "function f() { return a + b * c; }")
  equal("const f = x => x; /* after */", "const f = (x) => x; /* after */")
  // Async parameter wrappers alter TypeScript's AwaitContext parser flags;
  // retain that conservative distinction instead of discarding context flags.
  different("const f = async x => x; /* after */", "const f = async (x) => x; /* after */")
  different("const f = x => x", "const f = (x = 1) => x")
  different("const f = (x: number) => x", "const f = (x: string) => x")
  different("const f = x => x", "const f = ({ x }) => x")
  different("const f = x => x", "const f = (...x) => x")
  different("const f = x => x", "const f = (x, y) => x")
  different("const f = async\nx => x", "const f = async (x) => x")
  equal("function f() { (item as Wire).x = 1 }",
    "function f() { ;(item as Wire).x = 1 }")
  different('function f() { ;"use strict"; (item as Wire).x = 1 }',
    'function f() { "use strict"; (item as Wire).x = 1 }')
  different("function f() { while (ok); (item as Wire).x = 1 }",
    "function f() { while (ok) (item as Wire).x = 1 }")
  different("function f() { label:; (item as Wire).x = 1 }",
    "function f() { label: (item as Wire).x = 1 }")
  different("function f() { call()\n(item as Wire).x = 1 }",
    "function f() { call(); (item as Wire).x = 1 }")
  different("function f() { ; }", "function f() { }")
  different("function f() { ;x = 1 }", "function f() { x = 1 }")
  different("const f = /* @ts-ignore */ x => x",
    "const f = /* @ts-ignore */\n(x) => x")
  for (const text of ["const f = (x: number) => x", "const f = (x = 1) => x",
    "const f = (...x) => x", "const f = ({ x }) => x", "const f = (x, y) => x",
    "const f = async (x) => x"]) {
    const source = ts.createSourceFile("parameter-guard.ts", text, ts.ScriptTarget.Latest, true)
    let parameterCheck: boolean | undefined
    const find = (node: TypeScript.Node): void => {
      if (ts.isArrowFunction(node)) parameterCheck = optionalArrowParameter(ts, node)
      ts.forEachChild(node, find)
    }
    find(source)
    assert.equal(parameterCheck, false)
  }
  different("function f() { return (a || b) && c; }",
    "function f() { return a || (b && c); }")
  different("function f() { return (a?.b).c; }",
    "function f() { return a?.b.c; }")
  different("function f() { return (a?.b)(); }",
    "function f() { return a?.b(); }")
  different('function f() { "use strict"; return this; }',
    'function f() { ("use strict"); return this; }')
  different("function f() { return a; }", "function f() { return\n(a); }")
  different("function f() { return /* first */ a; }",
    "function f() { return /* changed */ (a); }")
  different("function f() { return (/* @ts-ignore */ a); }",
    "function f() { return (/* @ts-ignore */\n a); }")
  different('function f() { return "\\x61"; }',
    'function f() { return "a"; }')
  different('function f() { return tag`\\x61`; }',
    'function f() { return tag`a`; }')
}

export function verifyGeneratorArrowParameterNormalization(ts: typeof TypeScript): void {
  const structure = (text: string): string =>
    sourceStructure(ts, "generator-parameter-proof.ts", Buffer.from(text))
  const equal = (before: string, after: string): void =>
    assert.equal(structure(before), structure(after))
  const different = (before: string, after: string): void =>
    assert.notEqual(structure(before), structure(after))
  equal("function* f() { const cb = x => x; /* after */ }",
    "function* f() { const cb = (x) => x; /* after */ }")
  equal("class C { *f() { return items.map(x => x); } }",
    "class C { *f() { return items.map((x) => x); } }")
  equal("const f = function* () { yield items.map(x => x); }",
    "const f = function* () { yield items.map((x) => x); }")
  equal("function* f() { const cb = \\u0078 => x; }",
    "function* f() { const cb = (\\u0078) => x; }")
  different("function* f() { const cb = async x => x; }",
    "function* f() { const cb = async (x) => x; }")
  different("async function* f() { const cb = x => x; }",
    "async function* f() { const cb = (x) => x; }")
  different("function* f() { const cb = await => await; }",
    "function* f() { const cb = (await) => await; }")
  different("function* f() { const cb = \\u0061wait => await; }",
    "function* f() { const cb = (\\u0061wait) => await; }")
  different("function* f() { const cb = x => x; }",
    "function f() { const cb = (x) => x; }")
  different("function* f() { const cb = x => x; }",
    "function* f() { const cb = (x: number) => x; }")
  different("function* f() { const cb = x => x; }",
    "function* f() { const cb = (x = 1) => x; }")
  different("function* f() { const cb = x => x; }",
    "function* f() { const cb = (x) => x + 1; }")
  different("function* f() { const cb = /* @ts-ignore */ x => x; }",
    "function* f() { const cb = /* @ts-ignore */\n(x) => x; }")
  for (const name of ["yield", "\\u0079ield"]) {
    for (const parameter of [name, `(${name})`]) {
      assert.throws(() => structure(`function* f() { const cb = ${parameter} => 1; }`))
    }
  }
  const parse = (text: string): TypeScript.SourceFile =>
    ts.createSourceFile("generator-flags-proof.ts", text, ts.ScriptTarget.Latest, true)
  const arrowIn = (source: TypeScript.SourceFile): TypeScript.ArrowFunction => {
    let found: TypeScript.ArrowFunction | undefined
    const visit = (node: TypeScript.Node): void => {
      if (ts.isArrowFunction(node)) found = node
      ts.forEachChild(node, visit)
    }
    visit(source)
    assert(found)
    return found
  }
  // Other context flags, the arrow's flags, and the body's flags must not be
  // normalized even when the enclosing function is a generator.
  for (const target of ["parameter", "name", "arrow", "body"] as const) {
    const source = parse("function* f() { const cb = x => x; }")
    const arrow = arrowIn(source)
    const node = target === "parameter" ? arrow.parameters[0]
      : target === "name" ? arrow.parameters[0].name
      : target === "arrow" ? arrow : arrow.body
    const before = JSON.stringify(structuralAst(ts, source, source))
    ;(node as { flags: TypeScript.NodeFlags }).flags |= ts.NodeFlags.AwaitContext
    assert.notEqual(JSON.stringify(structuralAst(ts, source, source)), before)
  }
  for (const parameter of ["(x: number)", "(x = 1)", "(...x)", "({ x })", "(x, y)"]) {
    const source = parse(`function* f() { const cb = ${parameter} => x; }`)
    const arrow = arrowIn(source)
    const node = arrow.parameters[0]
    ;(node as { flags: TypeScript.NodeFlags }).flags = ts.NodeFlags.YieldContext
    assert.equal(generatorArrowParameterFlags(ts, node), ts.NodeFlags.YieldContext)
  }
}

export function verifyEmptyJsxIndentationNormalization(ts: typeof TypeScript): void {
  const structure = (text: string): string =>
    sourceStructure(ts, "jsx-indentation-proof.tsx", Buffer.from(text))
  const runtime = (text: string): string =>
    reactJsxRuntimeStructure(ts, "jsx-indentation-proof.tsx", Buffer.from(text))
  const equal = (before: string, after: string): void => {
    assert.equal(structure(before), structure(after))
    assert.equal(runtime(before), runtime(after))
  }
  const different = (before: string, after: string): void =>
    assert.notEqual(structure(before), structure(after))
  equal("const x = <div><A /></div>",
    "const x = <div>\n  <A />\n</div>")
  equal("const x = <><A /><B /></>",
    "const x = <>\n  <A />\n  <B />\n</>")
  equal("const x = <div>{value}</div>",
    "const x = <div>\r\n\t{value}\r\n</div>")
  equal("const x = <div><A /> keep<B /></div>",
    "const x = <div>\n  <A /> keep<B />\n</div>")
  equal("const x = <div>{/* keep */}<A /></div>",
    "const x = <div>\n  {/* keep */}<A />\n</div>")
  different("const x = <div><A /> <B /></div>",
    "const x = <div><A /><B /></div>")
  different("const x = <div><A /> <B /></div>",
    "const x = <div><A />\n  <B /></div>")
  for (const entity of ["&#32;", "&#10;", "&nbsp;"]) {
    different("const x = <div>" + entity + "</div>",
      "const x = <div>\n  </div>")
  }
  different("const x = <div>keep</div>", "const x = <div>changed</div>")
  different("const x = <div>hello\n world</div>", "const x = <div>hello world</div>")
  different("const x = <><A /><B /></>", "const x = <><B /><A /></>")
  different('const x = <div>{" "}</div>', "const x = <div></div>")
  different('const x = <div>{"\\n"}</div>', "const x = <div></div>")
  different("const x = <div>{/* keep */}<A /></div>",
    "const x = <div>{/* changed */}<A /></div>")
  different("const x = <div>{/* @ts-ignore */ value}</div>",
    "const x = <div>{/* @ts-ignore */\n value}</div>")
  different("const x = <A width={1} />", "const x = <A width={2} />")
  different("const x = <div>\u00a0</div>", "const x = <div>\n </div>")
  for (const [text, expected] of [
    ["\r\n\t ", true], [" ", false], ["\t", false], ["&#32;", false],
    ["\n text\n", false], ["\n\u00a0\n", false],
  ] as const) {
    const source = ts.createSourceFile("jsx-classifier.tsx",
      "const x = <div>" + text + "</div>", ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    let child: TypeScript.JsxText | undefined
    const visit = (node: TypeScript.Node): void => {
      if (ts.isJsxText(node)) child = node
      ts.forEachChild(node, visit)
    }
    visit(source)
    assert(child)
    assert.equal(isEmptyJsxIndentation(ts, child), expected)
  }
}

type StructuralDifference = {
  path: string
  before: string
  after: string
}

function compactValue(value: unknown): string {
  if (value === undefined) return "undefined"
  if (value !== null && typeof value === "object") {
    if (Array.isArray(value)) return `array(length=${value.length})`
    const object = value as Record<string, unknown>
    return `object(keys=${Object.keys(object).slice(0, 8).join(",")};kind=${object.kind ?? "none"})`
  }
  const encoded = JSON.stringify(value)
  return encoded.length <= 180 ? encoded : encoded.slice(0, 177) + "..."
}

function firstStructuralDifference(
  before: unknown,
  after: unknown,
  path = "$",
): StructuralDifference | undefined {
  if (Object.is(before, after)) return undefined
  if (before === null || after === null || typeof before !== "object" ||
    typeof after !== "object" || Array.isArray(before) !== Array.isArray(after)) {
    return { path: path.slice(0, 700), before: compactValue(before), after: compactValue(after) }
  }
  const previous = before as Record<string, unknown>
  const current = after as Record<string, unknown>
  if (Array.isArray(before) && Array.isArray(after) && before.length !== after.length) {
    return { path: (path + ".length").slice(0, 700),
      before: String(before.length), after: String(after.length) }
  }
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(current)])].sort()
  for (const key of keys) {
    const difference = firstStructuralDifference(previous[key], current[key],
      path + "." + key)
    if (difference) return difference
  }
  return undefined
}

export function verifyCompactDifferenceDiagnostics(): void {
  assert.equal(firstStructuralDifference({ a: [1, 2] }, { a: [1, 2] }), undefined)
  assert.deepEqual(firstStructuralDifference({ ast: { kind: 1 } }, { ast: { kind: 2 } }),
    { path: "$.ast.kind", before: "1", after: "2" })
  assert.deepEqual(firstStructuralDifference({ a: [] }, { a: {} }),
    { path: "$.a", before: "array(length=0)", after: "object(keys=;kind=none)" })
  assert.deepEqual(firstStructuralDifference({ a: [] }, { a: [0] }),
    { path: "$.a.length", before: "0", after: "1" })
  assert(compactValue("a".repeat(10_000)).length <= 180)
}

function git(repositoryRoot: string, args: string[]): Buffer {
  return execFileSync("git", args, { cwd: repositoryRoot,
    maxBuffer: maximumOutputBytes })
}

test("TEMP diagnostic: transport exact canonical consumer formatting", async () => {
  const repositoryRoot = realpathSync(process.cwd())
  const helperPath = realpathSync(fileURLToPath(import.meta.url))
  const manifestPath = realpathSync(fileURLToPath(new URL(
    "./core-fixed-copper-handoff-format-capture.manifest.json", import.meta.url)))
  const manifestBytes = readFileSync(manifestPath)
  const manifest: FormatManifest = JSON.parse(manifestBytes.toString("utf8"))
  assert.equal(manifest.schema, "pending-consumer-canonical-format/v1")
  assert.equal(manifest.repository, "tscircuit/core")
  assert.equal(manifest.stackBaseCommit, "a7c3465811c8ae5ab4d11b8a906ed1ff99e6abf4")
  assert.match(manifest.sourceCheckpointCommit, /^[0-9a-f]{40}$/)
  assert.match(manifest.publishManifestSha256, /^[0-9a-f]{64}$/)
  assert.match(manifest.biomeConfigSha256, /^[0-9a-f]{64}$/)
  assert.equal(manifest.biomeVersion, "1.9.4")
  assert.equal(manifest.typescriptVersion, "5.9.3")
  assert(manifest.files.length > 0, "Checkpoint file list is not populated")
  const publishManifestBytes = Buffer.from(manifest.publishManifestBase64, "base64")
  assert.equal(publishManifestBytes.toString("base64"), manifest.publishManifestBase64)
  assert.equal(sha256(publishManifestBytes), manifest.publishManifestSha256)
  const published = JSON.parse(publishManifestBytes.toString("utf8")) as {
    repository: string
    base: string
    files: {
      path: string; bytes: number; sha256: string
    }[]
  }
  assert.equal(published.repository, manifest.repository)
  assert.equal(published.base, manifest.stackBaseCommit)
  assert(published.files.length > 0)
  const publishedFiles = new Map<string, { bytes: number; sha256: string }>()
  for (const file of published.files) {
    assert(!publishedFiles.has(file.path),
      `Duplicate published source ${file.path}`)
    publishedFiles.set(file.path, file)
  }
  const helperRelative = relative(repositoryRoot, helperPath).split(sep).join("/")
  const manifestRelative = relative(repositoryRoot, manifestPath).split(sep).join("/")
  assert(!helperRelative.startsWith("../"))
  assert(!manifestRelative.startsWith("../"))
  git(repositoryRoot, ["merge-base", "--is-ancestor",
    manifest.sourceCheckpointCommit, "HEAD"])
  const diagnosticChanges = git(repositoryRoot, ["diff", "--name-only", "-z",
    manifest.sourceCheckpointCommit, "HEAD"]).toString("utf8").split("\0")
    .filter(Boolean)
  const diagnosticAllowlist = new Set([helperRelative, manifestRelative])
  const addedFiles = new Set(git(repositoryRoot, ["diff", "--diff-filter=A",
    "--name-only", "-z", manifest.sourceCheckpointCommit, "HEAD"])
    .toString("utf8").split("\0").filter(Boolean))
  for (const diagnostic of manifest.additionalDiagnosticFiles) {
    assert((diagnostic.path.startsWith("tests/") &&
      diagnostic.path.endsWith(".test.ts")) ||
      diagnostic.path === ".github/workflows/core-fixed-copper-handoff-repro-format.yml" ||
      diagnostic.path === ".github/workflows/core-fixed-copper-handoff-repro-typecheck.yml")
    assert(!diagnostic.path.includes("\\"))
    assert.equal(diagnostic.path.split("/").filter((part) =>
      part === "" || part === "." || part === "..").length, 0)
    assert(!diagnosticAllowlist.has(diagnostic.path))
    assert(addedFiles.has(diagnostic.path),
      "Additional diagnostic helper must be newly added after checkpoint")
    assert.match(diagnostic.sha256, /^[0-9a-f]{64}$/)
    assert(Number.isSafeInteger(diagnostic.bytes) && diagnostic.bytes > 0)
    const diagnosticPath = resolve(repositoryRoot, diagnostic.path)
    assert(diagnosticPath.startsWith(repositoryRoot + sep))
    assert.equal(realpathSync(diagnosticPath), diagnosticPath)
    assert(lstatSync(diagnosticPath).isFile())
    const diagnosticBytes = readFileSync(diagnosticPath)
    assert.equal(diagnosticBytes.length, diagnostic.bytes)
    assert.equal(sha256(diagnosticBytes), diagnostic.sha256)
    assert(diagnosticBytes.equals(git(repositoryRoot,
      ["show", `HEAD:${diagnostic.path}`])))
    diagnosticAllowlist.add(diagnostic.path)
  }
  assert(diagnosticChanges.every((path) => diagnosticAllowlist.has(path)),
  "Diagnostic branch changed checkpoint sources or configuration")
  const immutableSnapshots = new Map<string, Buffer>()
  for (const file of manifest.immutableFiles) {
    assert(!file.path.includes("\\"))
    assert.equal(file.path.split("/").filter((part) =>
      part === "" || part === "." || part === "..").length, 0)
    assert(!immutableSnapshots.has(file.path))
    assert(!manifest.files.some((selected) => selected.path === file.path))
    assert.match(file.sha256, /^[0-9a-f]{64}$/)
    assert.match(file.gitBlobSha1, /^[0-9a-f]{40}$/)
    const absolutePath = resolve(repositoryRoot, file.path)
    assert(absolutePath.startsWith(repositoryRoot + sep))
    assert.equal(realpathSync(absolutePath), absolutePath)
    assert(lstatSync(absolutePath).isFile())
    const bytes = readFileSync(absolutePath)
    assert.equal(bytes.length, file.bytes)
    assert.equal(sha256(bytes), file.sha256)
    assert.equal(createHash("sha1").update(Buffer.concat([
      Buffer.from(`blob ${bytes.length}\0`), bytes,
    ])).digest("hex"), file.gitBlobSha1)
    assert(bytes.equals(git(repositoryRoot,
      ["show", `${manifest.sourceCheckpointCommit}:${file.path}`])))
    const ownerFile = publishedFiles.get(file.path)
    if (ownerFile) {
      assert.equal(ownerFile.sha256, file.sha256)
      assert.equal(ownerFile.bytes, file.bytes)
    }
    immutableSnapshots.set(file.path, bytes)
  }
  assert(published.files.every((file) => immutableSnapshots.has(file.path) ||
    manifest.files.some((selected) => selected.path === file.path)),
  "Every owner source must be formatted or checked as immutable")
  const configPath = resolve(repositoryRoot, "biome.json")
  const configBefore = readFileSync(configPath)
  assert.equal(sha256(configBefore), manifest.biomeConfigSha256)
  assert(configBefore.equals(git(repositoryRoot,
    ["show", `${manifest.sourceCheckpointCommit}:biome.json`])))
  const require = createRequire(resolve(repositoryRoot, "package.json"))
  const ts = require("typescript") as typeof TypeScript
  assert.equal(ts.version, "5.9.3")
  const jsxConfig = ts.readConfigFile(resolve(repositoryRoot, "tsconfig.json"), ts.sys.readFile)
  assert.equal(jsxConfig.error, undefined)
  const jsxOptions = ts.convertCompilerOptionsFromJson(jsxConfig.config.compilerOptions, repositoryRoot)
  assert.equal(jsxOptions.errors.length, 0)
  assert.equal(jsxOptions.options.jsx, ts.JsxEmit.ReactJSX)
  assert.equal(jsxOptions.options.target, ts.ScriptTarget.ESNext)
  assert.equal(jsxOptions.options.module, ts.ModuleKind.ESNext)
  assert.equal(jsxOptions.options.moduleDetection, ts.ModuleDetectionKind.Force)
  verifyReturnParenthesesNormalization(ts)
  verifyGeneratorArrowParameterNormalization(ts)
  verifyEmptyJsxIndentationNormalization(ts)
  verifyCompactDifferenceDiagnostics()
  const biomePackagePath = require.resolve("@biomejs/biome/package.json")
  const biomePackage = JSON.parse(readFileSync(biomePackagePath, "utf8"))
  assert.equal(biomePackage.name, "@biomejs/biome")
  assert.equal(biomePackage.version, "1.9.4")
  const biomeBin = resolve(dirname(biomePackagePath),
    typeof biomePackage.bin === "string" ? biomePackage.bin : biomePackage.bin.biome)
  const runBiome = (args: string[]): string =>
    execFileSync(process.execPath, [biomeBin, ...args], {
      cwd: repositoryRoot, encoding: "utf8", maxBuffer: maximumOutputBytes,
      stdio: ["ignore", "pipe", "pipe"],
    })
  const cliVersion = runBiome(["--version"]).trim()
  assert.match(cliVersion, /^Version:\s*1\.9\.4$/)
  const seen = new Set<string>()
  const saved: SavedSource[] = []
  for (const requested of manifest.files) {
    assert.equal(typeof requested.path, "string")
    assert(!requested.path.includes("\\"))
    assert.equal(requested.path.split("/").filter((part) =>
      part === "" || part === "." || part === "..").length, 0)
    assert(/\.(ts|tsx|json)$/.test(requested.path))
    assert(!requested.path.startsWith(".github/"))
    assert(!requested.path.split("/").some((part) =>
      part === ".git" || part === "node_modules"))
    assert(!/^(?:biome|package|tsconfig(?:\.[^.]+)?)\.json$/.test(
      basename(requested.path)), "Formatter/config manifests are outside source scope")
    assert(!seen.has(requested.path), `Duplicate source ${requested.path}`)
    seen.add(requested.path)
    assert.match(requested.beforeSha256, /^[0-9a-f]{64}$/)
    assert(Number.isSafeInteger(requested.beforeBytes) && requested.beforeBytes > 0)
    const publishedFile = publishedFiles.get(requested.path)
    assert(publishedFile, `${requested.path} is absent from refreshed publish manifest`)
    assert.equal(requested.beforeSha256, publishedFile.sha256)
    assert.equal(requested.beforeBytes, publishedFile.bytes)
    const absolutePath = resolve(repositoryRoot, requested.path)
    assert(absolutePath.startsWith(repositoryRoot + sep))
    assert.equal(realpathSync(absolutePath), absolutePath, "Symlink source rejected")
    assert(lstatSync(absolutePath).isFile())
    assert(absolutePath !== helperPath && absolutePath !== manifestPath)
    const before = readFileSync(absolutePath)
    assert.equal(before.length, requested.beforeBytes)
    assert.equal(sha256(before), requested.beforeSha256)
    assert(before.equals(git(repositoryRoot,
      ["show", `${manifest.sourceCheckpointCommit}:${requested.path}`])),
    `Source ${requested.path} differs from official checkpoint`)
    saved.push({ path: requested.path, absolutePath, before,
      beforeSha256: requested.beforeSha256,
      beforeStructure: sourceStructure(ts, requested.path, before),
      kind: requested.path.endsWith(".json") ? "json-value" : "typescript-ast" })
  }
  let verified = false
  try {
    // Only the canonical formatter is invoked: no lint/check unsafe fixes,
    // config overrides, alternate versions, or extra input paths.
    const rejections: {
      path: string
      status: "rejected"
      stage: string
      beforeSha256: string
      afterSha256?: string
      difference?: StructuralDifference
      error?: string
    }[] = []
    const rejectedPaths = new Set<string>()
    for (const source of saved) {
      try {
        runBiome(["format", "--write", source.path])
      } catch (error) {
        rejectedPaths.add(source.path)
        rejections.push({ path: source.path, status: "rejected", stage: "format-write",
          beforeSha256: source.beforeSha256,
          error: (error instanceof Error ? error.message : String(error)).slice(0, 700) })
      }
    }
    const checked: { source: SavedSource; after: Buffer; afterStructure: string }[] = []
    for (const source of saved) {
      if (rejectedPaths.has(source.path)) continue
      let after: Buffer | undefined
      try {
        runBiome(["format", source.path])
        after = readFileSync(source.absolutePath)
        const afterStructure = sourceStructure(ts, source.path, after)
        const difference = firstStructuralDifference(JSON.parse(source.beforeStructure),
          JSON.parse(afterStructure))
        if (difference) {
          rejections.push({ path: source.path, status: "rejected", stage: "structure-or-comments",
            beforeSha256: source.beforeSha256, afterSha256: sha256(after), difference })
          continue
        }
        if (source.path.endsWith(".tsx")) {
          assert.equal(reactJsxRuntimeStructure(ts, source.path, source.before),
            reactJsxRuntimeStructure(ts, source.path, after),
            "ReactJSX runtime AST/comments changed: " + source.path)
        }
        if (source.kind === "json-value") {
          assert.deepEqual(JSON.parse(after.toString("utf8")),
            JSON.parse(source.before.toString("utf8")))
        }
        checked.push({ source, after, afterStructure })
      } catch (error) {
        rejections.push({ path: source.path, status: "rejected", stage: "format-or-structure-build",
          beforeSha256: source.beforeSha256,
          afterSha256: after ? sha256(after) : undefined,
          error: (error instanceof Error ? error.message : String(error)).slice(0, 700) })
      }
    }
    assert(readFileSync(configPath).equals(configBefore), "Biome config changed")
    for (const [path, bytes] of immutableSnapshots) {
      assert(readFileSync(resolve(repositoryRoot, path)).equals(bytes),
        `Ignored/native/provenance source changed: ${path}`)
    }
    if (rejections.length) {
      // Evaluate every source first. Failure output includes explicit rejected
      // inspection bytes for semantic review; no accepted source packet is emitted.
      const diagnostics = rejections.map((rejection) =>
        marker + "_REJECTED " + JSON.stringify(rejection)).join("\n") + "\n" +
        marker + "_REJECTED_SUMMARY " + JSON.stringify({ status: "rejected",
          files: saved.length, rejectedFiles: rejections.length,
          immutableFileCount: immutableSnapshots.size,
          checkedUnchangedStructure: checked.length,
          diagnosticHead: git(repositoryRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
          inputManifestSha256: sha256(manifestBytes),
          noAcceptedSourcePacketsEmitted: true, untrustedRejectedByteInspection: true }) + "\n"
      assert(Buffer.byteLength(diagnostics) <= 128 * 1024,
        "Compact rejection diagnostics exceed their bound")
      const reviewMarker = "PENDING_CONSUMER_REJECTED_FORMAT_INSPECTION_V1"
      const reviewLines = [reviewMarker + "_BEGIN " + JSON.stringify({
        status: "rejected-for-semantic-review", acceptedForApplication: false,
        sourceCheckpointCommit: manifest.sourceCheckpointCommit,
        diagnosticHead: git(repositoryRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
        inputManifestSha256: sha256(manifestBytes),
        rejectedFiles: rejections.length,
      })]
      let inspectedFiles = 0
      for (const rejection of rejections) {
        if (!rejection.afterSha256) continue
        const source = saved.find((entry) => entry.path === rejection.path)
        assert(source, "Rejected review path is not a selected source")
        const after = readFileSync(source.absolutePath)
        assert.equal(sha256(after), rejection.afterSha256)
        const compressed = gzipSync(after, { level: 9 })
        assert(gunzipSync(compressed).equals(after))
        const encoded = compressed.toString("base64")
        const parts = Math.ceil(encoded.length / chunkCharacters)
        reviewLines.push(reviewMarker + "_FILE " + JSON.stringify({
          status: "rejected-for-semantic-review", acceptedForApplication: false,
          path: source.path, beforeSha256: source.beforeSha256,
          afterSha256: sha256(after), afterBytes: after.length,
          gzipSha256: sha256(compressed), gzipBytes: compressed.length,
          base64Characters: encoded.length, parts,
        }))
        for (let part = 0; part < parts; part++) {
          const payload = encoded.slice(part * chunkCharacters, (part + 1) * chunkCharacters)
          reviewLines.push(reviewMarker + "_CHUNK " + JSON.stringify({ path: source.path,
            part, parts, payloadSha256: sha256(payload), payload }))
        }
        inspectedFiles++
      }
      const reviewBody = reviewLines.join("\n") + "\n"
      const review = reviewBody + reviewMarker + "_END " + JSON.stringify({
        status: "rejected-for-semantic-review", acceptedForApplication: false,
        inspectedFiles, bodySha256: sha256(reviewBody) }) + "\n"
      const rejectedOutput = diagnostics + review
      assert(Buffer.byteLength(rejectedOutput) <= maximumOutputBytes,
        "Untrusted rejected-source inspection exceeds bound; no output emitted")
      assert.equal(await Bun.write(Bun.stdout, rejectedOutput), Buffer.byteLength(rejectedOutput))
      assert.fail(`Canonical formatting rejected ${rejections.length}/${saved.length} sources; see compact rejection records`)
    }
    assert.equal(checked.length, saved.length)
    const header = { schema: manifest.schema, repository: manifest.repository,
      sourceCheckpointCommit: manifest.sourceCheckpointCommit,
      diagnosticHead: git(repositoryRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
      publishManifestSha256: manifest.publishManifestSha256,
      inputManifestSha256: sha256(manifestBytes),
      biomeConfigSha256: manifest.biomeConfigSha256,
      biomePackageVersion: biomePackage.version, biomeCliVersion: cliVersion,
      typescriptVersion: ts.version, fileCount: saved.length,
      jsxRuntimeProofFileCount: checked.filter(({ source }) => source.path.endsWith(".tsx")).length,
      immutableFileCount: immutableSnapshots.size,
      immutableManifestSha256: sha256(JSON.stringify(manifest.immutableFiles)) }
    const lines = [marker + "_BEGIN " + JSON.stringify(header)]
    let changedFiles = 0
    let rawBytes = 0
    let gzipBytes = 0
    for (const { source, after, afterStructure } of checked) {
      const changed = !after.equals(source.before)
      if (changed) changedFiles++
      rawBytes += after.length
      const compressed = gzipSync(after, { level: 9 })
      assert(gunzipSync(compressed).equals(after))
      gzipBytes += compressed.length
      const encoded = compressed.toString("base64")
      const parts = Math.ceil(encoded.length / chunkCharacters)
      lines.push(marker + "_FILE " + JSON.stringify({ path: source.path,
        beforeSha256: source.beforeSha256, afterSha256: sha256(after),
        beforeBytes: source.before.length, afterBytes: after.length, changed,
        verification: source.kind, structureSha256: sha256(afterStructure),
        ...(source.path.endsWith(".tsx") ? {
          jsxRuntimeStructureSha256: sha256(reactJsxRuntimeStructure(ts, source.path, after)),
        } : {}),
        gzipSha256: sha256(compressed), gzipBytes: compressed.length,
        base64Characters: encoded.length, parts }))
      for (let part = 0; part < parts; part++) {
        const payload = encoded.slice(part * chunkCharacters,
          (part + 1) * chunkCharacters)
        lines.push(marker + "_CHUNK " + JSON.stringify({ path: source.path,
          part, parts, payloadSha256: sha256(payload), payload }))
      }
    }
    assert(readFileSync(configPath).equals(configBefore), "Biome config changed")
    const body = lines.join("\n") + "\n"
    const output = body + marker + "_END " + JSON.stringify({
      files: saved.length, changedFiles, rawBytes, gzipBytes,
      bodySha256: sha256(body) }) + "\n"
    assert(Buffer.byteLength(output, "utf8") <= maximumOutputBytes,
      "Complete formatted transport exceeds 2 MiB; no partial records emitted")
    assert.equal(await Bun.write(Bun.stdout, output),
      Buffer.byteLength(output, "utf8"))
    verified = true
  } finally {
    // Failed verification restores the exact bytes and remains a failed test.
    // Only bounded rejection diagnostics may precede a failure. No partial or
    // unverified source bytes are emitted or accepted as formatted source.
    if (!verified) {
      for (const source of saved) writeFileSync(source.absolutePath, source.before)
    }
  }
})
