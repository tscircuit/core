import { Glob } from "bun"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"

export type SourceInventory = ReturnType<typeof inspectSource>

export function inspectSource(context: { root: string; sourcePath: string }) {
  const sourceText = readFileSync(
    path.join(context.root, context.sourcePath),
    "utf8",
  )
  const source = ts.createSourceFile(
    context.sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    context.sourcePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const imports: string[] = []
  const phaseMethods: {
    name: string
    phase: string
    kind: string
    line: number
    nativeEffectHook: boolean
  }[] = []
  const resourceSites: {
    operation: string
    line: number
    enclosing: string
  }[] = []
  const asyncFunctions: { name: string; line: number }[] = []
  let awaits = 0
  const lineOf = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  const nameOf = (node: ts.Node): string => {
    if (
      "name" in node &&
      node.name &&
      typeof node.name === "object" &&
      "getText" in node.name
    ) {
      return (node.name as ts.Node).getText(source)
    }
    return "anonymous"
  }
  const enclosingName = (node: ts.Node): string => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (ts.isFunctionLike(parent)) return nameOf(parent)
    }
    return "module"
  }
  const resourceOperations = new Set([
    "_queueAsyncEffect",
    "_queueEffect",
    "fetch",
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "then",
    "catch",
    "finally",
    "addEventListener",
    "removeEventListener",
    "on",
    "off",
    "removeListener",
    "runPromise",
    "runPromiseExit",
    "runCallback",
    "runFork",
    "acquireRelease",
    "addFinalizer",
    "dispose",
    "stop",
    "abort",
    "start",
    "new Promise",
    "new AbortController",
  ])
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text)
    }
    if (ts.isMethodDeclaration(node)) {
      const name = nameOf(node)
      const match = /^(doInitial|update|remove)([A-Z].*)$/.exec(name)
      if (match)
        phaseMethods.push({
          name,
          kind: match[1],
          phase: match[2].replace(/Effect$/, ""),
          line: lineOf(node),
          nativeEffectHook: name.endsWith("Effect"),
        })
    }
    if (
      ts.isFunctionLike(node) &&
      ts.canHaveModifiers(node) &&
      ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
    ) {
      asyncFunctions.push({ name: nameOf(node), line: lineOf(node) })
    }
    if (ts.isAwaitExpression(node)) awaits++
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const expression = node.expression
      const operation = `${ts.isNewExpression(node) ? "new " : ""}${ts.isPropertyAccessExpression(expression) ? expression.name.text : expression.getText(source)}`
      if (resourceOperations.has(operation))
        resourceSites.push({
          operation,
          line: lineOf(node),
          enclosing: enclosingName(node),
        })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  const nativeEffectImports = imports.filter(
    (name) => name === "effect" || name.startsWith("effect/"),
  )
  const effectServiceImports = imports.filter(
    (name) => name.startsWith("lib/effect/") || /(?:^|\/)effect\//.test(name),
  )
  const category = context.sourcePath.endsWith(".d.ts")
    ? "declaration_boundary"
    : context.sourcePath.startsWith("lib/effect/") ||
        nativeEffectImports.length > 0
      ? "effect_program_or_runtime"
      : effectServiceImports.length > 0
        ? "effect_integrated_facade"
        : phaseMethods.length > 0
          ? "synchronous_render_phase_adapter"
          : /^lib\/(?:hooks|fiber|namespaced-elements)\//.test(
                context.sourcePath,
              )
            ? "react_public_adapter"
            : /(?:^lib\/I[^/]+\.ts$|\/errors\/|\/events\/|types?\.ts$)/.test(
                  context.sourcePath,
                )
              ? "domain_type_or_error_boundary"
              : "domain_value_module"
  return {
    path: context.sourcePath,
    contentSha256: createHash("sha256").update(sourceText).digest("hex"),
    lines: sourceText.split("\n").length,
    category,
    nativeEffectImports,
    effectServiceImports,
    phaseMethods,
    resourceSites,
    asyncFunctions,
    awaits,
  }
}

export function buildInventory(root = process.cwd()) {
  const sourcePaths = Array.from(
    new Glob("lib/**/*.{ts,tsx}").scanSync({ cwd: root }),
  ).sort()
  const sourceModules = sourcePaths.map((sourcePath) =>
    inspectSource({ root, sourcePath }),
  )
  const phasePath = path.join(root, "lib/effect/render-phase-definitions.ts")
  const phaseText = readFileSync(
    existsSync(phasePath)
      ? phasePath
      : path.join(root, "lib/components/base-components/Renderable.ts"),
    "utf8",
  )
  const phaseArray = /orderedRenderPhases\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(
    phaseText,
  )?.[1]
  if (!phaseArray) throw new Error("Cannot locate ordered render phases")
  const renderPhases = Array.from(
    phaseArray.matchAll(/"([^"]+)"/g),
    (match) => match[1],
  )
  const categoryCounts: Record<string, number> = {}
  for (const sourceModule of sourceModules)
    categoryCounts[sourceModule.category] =
      (categoryCounts[sourceModule.category] ?? 0) + 1
  const phaseCoverage = renderPhases.map((phase, phaseIndex) => ({
    phase,
    phaseIndex,
    dispatch: "lib/effect/render-phase-programs.ts",
    implementations: sourceModules.flatMap((sourceModule) =>
      sourceModule.phaseMethods
        .filter((method) => method.phase === phase)
        .map((method) => ({ path: sourceModule.path, ...method })),
    ),
  }))
  const legacyQueueCalls = sourceModules.flatMap((sourceModule) =>
    sourceModule.resourceSites
      .filter((site) => site.operation === "_queueAsyncEffect")
      .map((site) => ({ path: sourceModule.path, ...site })),
  )
  return {
    schemaVersion: 1,
    generatedUtc: new Date().toISOString(),
    scope:
      "Every TypeScript/TSX source module in lib; classification is evidence, not a completion claim",
    sourceModuleCount: sourceModules.length,
    renderPhaseCount: renderPhases.length,
    phaseImplementationCount: phaseCoverage.reduce(
      (count, phase) => count + phase.implementations.length,
      0,
    ),
    nativePhaseHookCount: phaseCoverage.reduce(
      (count, phase) =>
        count +
        phase.implementations.filter((hook) => hook.nativeEffectHook).length,
      0,
    ),
    retainedAssetPaths: Array.from(new Glob("lib/**/*").scanSync({ cwd: root }))
      .filter((sourcePath) => !/\.(?:ts|tsx)$/.test(sourcePath))
      .sort(),
    categoryCounts,
    legacyQueueCalls,
    phaseCoverage,
    sourceModules,
  }
}

if (import.meta.main) {
  const inventory = buildInventory()
  const outputPath = process.argv[2] ?? "effect-4-inventory.json"
  writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        outputPath,
        sourceModuleCount: inventory.sourceModuleCount,
        renderPhaseCount: inventory.renderPhaseCount,
        phaseImplementationCount: inventory.phaseImplementationCount,
        categoryCounts: inventory.categoryCounts,
        legacyQueueCalls: inventory.legacyQueueCalls,
      },
      null,
      2,
    ),
  )
}
