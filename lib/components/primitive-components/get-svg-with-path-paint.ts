type SvgPathPaint = "fill" | "stroke"

type SvgPaintSettings = Record<SvgPathPaint, string>

const SVG_ELEMENT_TAG_PATTERN = /<\/?[a-z][^>]*>/giu
const DEFAULT_SVG_PAINT: SvgPaintSettings = {
  fill: "black",
  stroke: "none",
}

const getAttribute = ({
  attributeName,
  pathTag,
}: {
  attributeName: string
  pathTag: string
}): string | undefined => {
  const attributePattern = new RegExp(
    `(?:^|\\s)${attributeName}\\s*=\\s*(["'])(.*?)\\1`,
    "iu",
  )
  return pathTag.match(attributePattern)?.[2]
}

const getInlineStylePaint = ({
  paint,
  pathTag,
}: {
  paint: SvgPathPaint
  pathTag: string
}): string | undefined => {
  const style = getAttribute({ attributeName: "style", pathTag })
  if (!style) return undefined

  for (const declaration of style.split(";")) {
    const [propertyName, propertyPaint] = declaration.split(":", 2)
    if (propertyName?.trim().toLowerCase() === paint) {
      return propertyPaint?.trim()
    }
  }
  return undefined
}

const resolveElementPaint = ({
  inheritedPaint,
  paint,
  tag,
}: {
  inheritedPaint: string
  paint: SvgPathPaint
  tag: string
}): string => {
  const localPaint =
    getInlineStylePaint({ paint, pathTag: tag }) ??
    getAttribute({ attributeName: paint, pathTag: tag })
  const normalizedPaint = localPaint
    ?.replace(/\s*!important\s*$/iu, "")
    .trim()
    .toLowerCase()

  if (!normalizedPaint || normalizedPaint === "inherit") return inheritedPaint
  if (normalizedPaint === "unset") return inheritedPaint
  if (
    normalizedPaint === "initial" ||
    normalizedPaint === "revert" ||
    normalizedPaint === "revert-layer"
  ) {
    return DEFAULT_SVG_PAINT[paint]
  }
  return normalizedPaint
}

const getElementName = (tag: string): string | undefined =>
  tag.match(/^<\/?\s*([a-z][\w:.-]*)/iu)?.[1]?.toLowerCase()

const removePathData = (pathTag: string): string =>
  pathTag.replace(/\s+d\s*=\s*(["']).*?\1/iu, "")

export const getSvgWithPathPaint = ({
  paint,
  svg,
}: {
  paint: SvgPathPaint
  svg: string
}): string => {
  const paintStack: SvgPaintSettings[] = []

  return svg.replace(SVG_ELEMENT_TAG_PATTERN, (tag) => {
    const elementName = getElementName(tag)
    if (!elementName) return tag

    if (/^<\//u.test(tag)) {
      paintStack.pop()
      return tag
    }

    const inheritedPaint = paintStack.at(-1) ?? DEFAULT_SVG_PAINT
    const elementPaint: SvgPaintSettings = {
      fill: resolveElementPaint({
        inheritedPaint: inheritedPaint.fill,
        paint: "fill",
        tag,
      }),
      stroke: resolveElementPaint({
        inheritedPaint: inheritedPaint.stroke,
        paint: "stroke",
        tag,
      }),
    }

    if (!/\/\s*>$/u.test(tag)) paintStack.push(elementPaint)
    if (elementName !== "path" || elementPaint[paint] !== "none") return tag

    // image-utils extracts every path's `d` regardless of SVG paint. Removing
    // only `d` keeps the surrounding XML and transform hierarchy intact.
    return removePathData(tag)
  })
}
