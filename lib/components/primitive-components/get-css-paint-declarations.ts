import type { ChildNode } from "postcss"

export type SvgPathPaint = "fill" | "stroke"

export type CssPaintDeclaration = {
  important: boolean
  paintSetting: string
}

type CssPaintDeclarations = Partial<Record<SvgPathPaint, CssPaintDeclaration>>

const setPaintDeclaration = ({
  declarations,
  important,
  paintSetting,
  propertyName,
}: {
  declarations: CssPaintDeclarations
  important: boolean
  paintSetting: string
  propertyName: string
}) => {
  if (propertyName !== "fill" && propertyName !== "stroke") return
  const previousDeclaration = declarations[propertyName]
  if (!previousDeclaration?.important || important) {
    declarations[propertyName] = { important, paintSetting }
  }
}

export const getCssPaintDeclarationsFromInlineStyle = (
  inlineStyle: string,
): CssPaintDeclarations => {
  const declarations: CssPaintDeclarations = {}
  for (const inlineDeclaration of inlineStyle.split(";")) {
    const separatorIndex = inlineDeclaration.indexOf(":")
    if (separatorIndex < 0) continue
    const propertyName = inlineDeclaration
      .slice(0, separatorIndex)
      .trim()
      .toLowerCase()
    const rawPaintSetting = inlineDeclaration.slice(separatorIndex + 1).trim()
    const important = /\s*!important\s*$/iu.test(rawPaintSetting)
    const paintSetting = rawPaintSetting
      .replace(/\s*!important\s*$/iu, "")
      .trim()
    setPaintDeclaration({
      declarations,
      important,
      paintSetting,
      propertyName,
    })
  }
  return declarations
}

export const getCssPaintDeclarationsFromStylesheetNodes = (
  stylesheetNodes: ChildNode[],
): CssPaintDeclarations => {
  const declarations: CssPaintDeclarations = {}
  for (const stylesheetNode of stylesheetNodes) {
    if (stylesheetNode.type !== "decl") continue
    setPaintDeclaration({
      declarations,
      important: stylesheetNode.important,
      paintSetting: stylesheetNode.value.trim(),
      propertyName: stylesheetNode.prop.trim().toLowerCase(),
    })
  }
  return declarations
}
