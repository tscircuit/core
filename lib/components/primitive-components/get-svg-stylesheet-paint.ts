export type SvgPathPaint = "fill" | "stroke"

type CssPaintDeclaration = {
  important: boolean
  value: string
}

export type SvgStylesheetPaintRule = {
  declarations: Partial<Record<SvgPathPaint, CssPaintDeclaration>>
  order: number
  selector: string
}

const getAttribute = (tag: string, attributeName: string): string | undefined =>
  tag.match(
    new RegExp(`(?:^|\\s)${attributeName}\\s*=\\s*(["'])(.*?)\\1`, "iu"),
  )?.[2]

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
    const rawValue = declaration.slice(separatorIndex + 1).trim()
    const important = /\s*!important\s*$/iu.test(rawValue)
    const value = rawValue.replace(/\s*!important\s*$/iu, "").trim()
    const previousDeclaration = declarations[propertyName]
    if (!previousDeclaration?.important || important) {
      declarations[propertyName] = { important, value }
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
    const stylesheet = styleMatch[1]?.replace(/\/\*[\s\S]*?\*\//gu, "") ?? ""
    for (const ruleMatch of stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
      const declarations = getPaintDeclarations(ruleMatch[2] ?? "")
      for (const selector of (ruleMatch[1] ?? "").split(",")) {
        rules.push({
          declarations,
          order: rules.length,
          selector: selector.trim(),
        })
      }
    }
  }
  return rules
}

const getSelectorSpecificityIfMatching = ({
  elementName,
  selector,
  tag,
}: {
  elementName: string
  selector: string
  tag: string
}): number | undefined => {
  const selectorMatch = selector.match(
    /^([a-z_][\w:-]*|\*)?((?:[.#][\w-]+)*)$/iu,
  )
  if (!selectorMatch) return undefined
  const selectorElementName = selectorMatch[1]?.toLowerCase()
  if (
    selectorElementName &&
    selectorElementName !== "*" &&
    selectorElementName !== elementName
  ) {
    return undefined
  }
  const classNames = new Set((getAttribute(tag, "class") ?? "").split(/\s+/u))
  const id = getAttribute(tag, "id")
  const qualifierText = selectorMatch[2] ?? ""
  const requiredClasses = [...qualifierText.matchAll(/\.([\w-]+)/gu)].map(
    (match) => match[1],
  )
  const requiredIds = [...qualifierText.matchAll(/#([\w-]+)/gu)].map(
    (match) => match[1],
  )
  if (requiredClasses.some((className) => !classNames.has(className))) {
    return undefined
  }
  if (requiredIds.some((requiredId) => requiredId !== id)) return undefined
  return (
    requiredIds.length * 10_000 +
    requiredClasses.length * 100 +
    (selectorElementName && selectorElementName !== "*" ? 1 : 0)
  )
}

export const getSvgElementLocalPaint = ({
  elementName,
  paint,
  stylesheetRules,
  tag,
}: {
  elementName: string
  paint: SvgPathPaint
  stylesheetRules: SvgStylesheetPaintRule[]
  tag: string
}): string | undefined => {
  let winningDeclaration:
    | (CssPaintDeclaration & { precedence: number })
    | undefined
  const presentationValue = getAttribute(tag, paint)
  if (presentationValue) {
    winningDeclaration = {
      important: false,
      precedence: 0,
      value: presentationValue,
    }
  }
  for (const rule of stylesheetRules) {
    const declaration = rule.declarations[paint]
    const specificity = getSelectorSpecificityIfMatching({
      elementName,
      selector: rule.selector,
      tag,
    })
    if (!declaration || specificity === undefined) continue
    const precedence = specificity * 1_000 + rule.order
    if (
      !winningDeclaration ||
      Number(declaration.important) > Number(winningDeclaration.important) ||
      (declaration.important === winningDeclaration.important &&
        precedence >= winningDeclaration.precedence)
    ) {
      winningDeclaration = { ...declaration, precedence }
    }
  }
  const inlineDeclaration = getPaintDeclarations(
    getAttribute(tag, "style") ?? "",
  )[paint]
  if (
    inlineDeclaration &&
    (!winningDeclaration ||
      inlineDeclaration.important ||
      !winningDeclaration.important)
  ) {
    winningDeclaration = {
      ...inlineDeclaration,
      precedence: Number.MAX_SAFE_INTEGER,
    }
  }
  return winningDeclaration?.value
}
