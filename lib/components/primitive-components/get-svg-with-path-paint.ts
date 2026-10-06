type SvgPathPaint = "fill" | "stroke"

const SVG_PATH_TAG_PATTERN = /<path\b[^>]*>/giu

const getAttribute = ({
  attributeName,
  pathTag,
}: {
  attributeName: string
  pathTag: string
}): string | undefined => {
  const attributePattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`,
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

const hasVisiblePathPaint = ({
  paint,
  pathTag,
}: {
  paint: SvgPathPaint
  pathTag: string
}): boolean => {
  const paintSetting =
    getInlineStylePaint({ paint, pathTag }) ??
    getAttribute({ attributeName: paint, pathTag })
  if (paintSetting?.trim().toLowerCase() === "none") return false
  return paint === "fill" || paintSetting !== undefined
}

export const getSvgWithPathPaint = ({
  paint,
  svg,
}: {
  paint: SvgPathPaint
  svg: string
}): string =>
  svg.replace(SVG_PATH_TAG_PATTERN, (pathTag) =>
    hasVisiblePathPaint({ paint, pathTag }) ? pathTag : "",
  )
