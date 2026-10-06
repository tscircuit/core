import { is } from "css-select"
import { type Selector, parse } from "css-what"
import { getSvgSelectorSpecificity } from "./get-svg-selector-specificity"
import {
  type SvgElementNode,
  svgElementCssSelectAdapter,
} from "./svg-element-css-select-adapter"

export type SvgPathPaint = "fill" | "stroke"

type CssPaintDeclaration = { important: boolean; paintSetting: string }

export type SvgStylesheetPaintRule = {
  declarations: Partial<Record<SvgPathPaint, CssPaintDeclaration>>
  order: number
  selector: Selector[][]
  specificity: number
}

const getPaintDeclarations = (
  declarationBlock: string,
): Partial<Record<SvgPathPaint, CssPaintDeclaration>> => {
  const declarations: Partial<Record<SvgPathPaint, CssPaintDeclaration>> = {}
  for (const declaration of declarationBlock.split(";")) {
    const separatorIndex = declaration.indexOf(":")
    if (separatorIndex < 0) continue
    const propertyName = declaration
      .slice(0, separatorIndex)
      .trim()
      .toLowerCase()
    if (propertyName !== "fill" && propertyName !== "stroke") continue
    const rawPaintSetting = declaration.slice(separatorIndex + 1).trim()
    const important = /\s*!important\s*$/iu.test(rawPaintSetting)
    const paintSetting = rawPaintSetting
      .replace(/\s*!important\s*$/iu, "")
      .trim()
    const previousDeclaration = declarations[propertyName]
    if (!previousDeclaration?.important || important) {
      declarations[propertyName] = { important, paintSetting }
    }
  }
  return declarations
}
export const getSvgStylesheetPaintRules = (
  svg: string,
): SvgStylesheetPaintRule[] => {
  const rules: SvgStylesheetPaintRule[] = []
  const stylePattern = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/giu
  for (const styleMatch of svg.matchAll(stylePattern)) {
    const stylesheet = (styleMatch[1] ?? "")
      .replace(/<!\[CDATA\[|\]\]>/gu, "")
      .replace(/\/\*[\s\S]*?\*\//gu, "")
    for (const ruleMatch of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const declarations = getPaintDeclarations(ruleMatch[2] ?? "")
      try {
        for (const selector of parse(ruleMatch[1] ?? "")) {
          rules.push({
            declarations,
            order: rules.length,
            selector: [selector],
            specificity: getSvgSelectorSpecificity(selector),
          })
        }
      } catch {
        // Ignore malformed or unsupported author stylesheet rules.
      }
    }
  }
  return rules
}
type RankedPaintDeclaration = CssPaintDeclaration & {
  order: number
  specificity: number
}

const shouldReplaceDeclaration = (
  current: RankedPaintDeclaration | undefined,
  candidate: RankedPaintDeclaration,
): boolean =>
  !current ||
  Number(candidate.important) > Number(current.important) ||
  (candidate.important === current.important &&
    (candidate.specificity > current.specificity ||
      (candidate.specificity === current.specificity &&
        candidate.order >= current.order)))

export const getSvgElementLocalPaint = ({
  element,
  paint,
  stylesheetRules,
}: {
  element: SvgElementNode
  paint: SvgPathPaint
  stylesheetRules: SvgStylesheetPaintRule[]
}): string | undefined => {
  const presentationPaintSetting = element.attributes[paint]
  let winningDeclaration: RankedPaintDeclaration | undefined =
    presentationPaintSetting
      ? {
          important: false,
          order: -1,
          paintSetting: presentationPaintSetting,
          specificity: 0,
        }
      : undefined
  for (const rule of stylesheetRules) {
    const declaration = rule.declarations[paint]
    if (
      !declaration ||
      !is<SvgElementNode, SvgElementNode>(element, rule.selector, {
        adapter: svgElementCssSelectAdapter,
        xmlMode: true,
      })
    ) {
      continue
    }
    const candidate = {
      ...declaration,
      order: rule.order,
      specificity: rule.specificity,
    }
    if (shouldReplaceDeclaration(winningDeclaration, candidate)) {
      winningDeclaration = candidate
    }
  }
  const inlineDeclaration = getPaintDeclarations(
    element.attributes.style ?? "",
  )[paint]
  const inlineCandidate = inlineDeclaration
    ? { ...inlineDeclaration, order: 0, specificity: Number.MAX_SAFE_INTEGER }
    : undefined
  if (
    inlineCandidate &&
    shouldReplaceDeclaration(winningDeclaration, inlineCandidate)
  ) {
    winningDeclaration = inlineCandidate
  }
  return winningDeclaration?.paintSetting
}
