import { is } from "css-select"
import { type Selector, parse } from "css-what"
import { type Root, parse as parseCss } from "postcss"
import {
  type CssPaintDeclaration,
  type SvgPathPaint,
  getCssPaintDeclarationsFromInlineStyle,
  getCssPaintDeclarationsFromStylesheetNodes,
} from "./get-css-paint-declarations"
import { getSvgSelectorSpecificity } from "./get-svg-selector-specificity"
import {
  type SvgElementNode,
  svgElementCssSelectAdapter,
} from "./svg-element-css-select-adapter"

export type { SvgPathPaint } from "./get-css-paint-declarations"

export type SvgStylesheetPaintRule = {
  declarations: Partial<Record<SvgPathPaint, CssPaintDeclaration>>
  order: number
  selector: Selector[][]
  specificity: number
}

export const getSvgStylesheetPaintRules = (
  svg: string,
): SvgStylesheetPaintRule[] => {
  const rules: SvgStylesheetPaintRule[] = []
  const stylePattern = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/giu
  for (const styleMatch of svg.matchAll(stylePattern)) {
    const stylesheet = (styleMatch[1] ?? "").replace(/<!\[CDATA\[|\]\]>/gu, "")
    let stylesheetRoot: Root
    try {
      stylesheetRoot = parseCss(stylesheet)
    } catch {
      continue
    }
    for (const stylesheetNode of stylesheetRoot.nodes) {
      // Conditional at-rules require an SVG rendering environment to evaluate.
      // Ignore their whole scope instead of promoting nested rules to top-level.
      if (stylesheetNode.type !== "rule") continue
      const declarations = getCssPaintDeclarationsFromStylesheetNodes(
        stylesheetNode.nodes,
      )
      try {
        for (const selector of parse(stylesheetNode.selector)) {
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
  const inlineDeclaration = getCssPaintDeclarationsFromInlineStyle(
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
