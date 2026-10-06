import {
  getSvgElementLocalPaint,
  getSvgStylesheetPaintRules,
  type SvgPathPaint,
} from "./get-svg-stylesheet-paint"
import { parseSvgElementTree } from "./parse-svg-element-tree"
import type { SvgElementNode } from "./svg-element-css-select-adapter"

type SvgPaintSettings = Record<SvgPathPaint, string>

const DEFAULT_SVG_PAINT: SvgPaintSettings = {
  fill: "black",
  stroke: "none",
}

const resolveElementPaint = ({
  inheritedPaint,
  localPaint,
  paint,
}: {
  inheritedPaint: string
  localPaint: string | undefined
  paint: SvgPathPaint
}): string => {
  const normalizedPaint = localPaint?.trim().toLowerCase()

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

const removePathData = (pathTag: string): string =>
  pathTag.replace(/\s+d\s*=\s*(["'])[\s\S]*?\1/iu, "")

export const getSvgWithPathPaint = ({
  paint,
  svg,
}: {
  paint: SvgPathPaint
  svg: string
}): string => {
  const stylesheetRules = getSvgStylesheetPaintRules(svg)
  const paintByElement = new Map<SvgElementNode, SvgPaintSettings>()
  let output = ""
  let outputCursor = 0
  for (const tag of parseSvgElementTree(svg)) {
    output += svg.slice(outputCursor, tag.start)
    outputCursor = tag.end
    const element = tag.element
    if (!element) {
      output += tag.raw
      continue
    }
    const inheritedPaint = element.parent
      ? (paintByElement.get(element.parent) ?? DEFAULT_SVG_PAINT)
      : DEFAULT_SVG_PAINT
    const elementPaint: SvgPaintSettings = {
      fill: resolveElementPaint({
        inheritedPaint: inheritedPaint.fill,
        localPaint: getSvgElementLocalPaint({
          element,
          paint: "fill",
          stylesheetRules,
        }),
        paint: "fill",
      }),
      stroke: resolveElementPaint({
        inheritedPaint: inheritedPaint.stroke,
        localPaint: getSvgElementLocalPaint({
          element,
          paint: "stroke",
          stylesheetRules,
        }),
        paint: "stroke",
      }),
    }
    paintByElement.set(element, elementPaint)
    if (element.name !== "path" || elementPaint[paint] !== "none") {
      output += tag.raw
      continue
    }
    // image-utils extracts every path's `d` regardless of SVG paint. Removing
    // only `d` keeps the surrounding XML and transform hierarchy intact.
    output += removePathData(tag.raw)
  }
  return output + svg.slice(outputCursor)
}
