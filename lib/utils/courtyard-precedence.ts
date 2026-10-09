import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

const footprintCourtyards = new WeakSet<PrimitiveComponent>()

const isCourtyard = (primitive: PrimitiveComponent) =>
  primitive.componentName === "CourtyardRect" ||
  primitive.componentName === "CourtyardCircle" ||
  primitive.componentName === "CourtyardOutline"

/** Track footprint provenance even when primitives are attached directly to a part. */
export const markFootprintCourtyards = (primitives: PrimitiveComponent[]) => {
  for (const primitive of primitives) {
    if (isCourtyard(primitive)) footprintCourtyards.add(primitive)
    markFootprintCourtyards(primitive.children)
  }
}

const isFootprintCourtyard = (courtyard: PrimitiveComponent) => {
  if (footprintCourtyards.has(courtyard)) return true

  for (
    let ancestor = courtyard.parent;
    ancestor && !ancestor.isPrimitiveContainer;
    ancestor = ancestor.parent
  ) {
    if (ancestor.componentName === "Footprint") return true
  }
  return false
}

/** Explicit courtyard children replace the part's entire footprint courtyard set. */
export const shouldRenderCourtyard = (courtyard: PrimitiveComponent) => {
  if (!isFootprintCourtyard(courtyard)) return true

  const part = courtyard.getPrimitiveContainer()
  if (!part || part.isGroup) return true

  return !part.children.some(
    (child) => isCourtyard(child) && !isFootprintCourtyard(child),
  )
}
