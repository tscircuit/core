import type { AssemblyDrawingDimension } from "lib/components/primitive-components/AssemblyDrawingDimension"
import type { AssemblyDrawingPartView } from "lib/components/primitive-components/AssemblyDrawingPartView"
import type { DrawingModelFeature } from "../geometry/get-drawing-model-features"
import type { createDrawingReferenceSelector } from "./create-drawing-reference-selector"

export function resolveDrawingEdgeReferences(
  view: AssemblyDrawingPartView,
  dimensions: AssemblyDrawingDimension[],
  select: ReturnType<typeof createDrawingReferenceSelector>,
) {
  const resolved = new Map<AssemblyDrawingDimension, DrawingModelFeature>()
  for (const dimension of dimensions) {
    const selector = dimension._parsedProps.edgeRef
    if (!selector) continue
    const matches = select(selector).flatMap((node) =>
      node.feature ? [node.feature] : [],
    )
    if (matches.length !== 1)
      throw new Error(
        `Dimension edgeRef "${selector}" in part view "${view.name || "unnamed part view"}" matched ${matches.length} named model features in the selected geometry; expected exactly one`,
      )
    resolved.set(dimension, matches[0]!)
  }
  return resolved
}
