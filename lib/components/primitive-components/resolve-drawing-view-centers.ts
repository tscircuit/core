import { selectAll } from "css-select"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "../base-components/PrimitiveComponent/preprocessSelector"
import type { AssemblyDrawingPage } from "./AssemblyDrawingPage"
import { AssemblyDrawingPartView } from "./AssemblyDrawingPartView"

/** Paper-space points in mm, +X right and +Y up. Viewport centers are independent
 * of the right-handed CAD world frame (+Z up); they never transform model points.
 * Resolve axes independently so cross-axis dependencies do not create false cycles.
 */
export function resolveDrawingViewCenters(page: AssemblyDrawingPage) {
  const views = page.children.filter(
    (child): child is AssemblyDrawingPartView =>
      child instanceof AssemblyDrawingPartView,
  )
  const centers = {
    x: new Map<AssemblyDrawingPartView, number>(),
    y: new Map<AssemblyDrawingPartView, number>(),
  }
  const resolving = {
    x: new Set<AssemblyDrawingPartView>(),
    y: new Set<AssemblyDrawingPartView>(),
  }
  const resolveAxis = (
    view: AssemblyDrawingPartView,
    axis: "x" | "y",
  ): number => {
    if (centers[axis].has(view)) return centers[axis].get(view)!
    if (resolving[axis].has(view))
      throw new Error(
        `Drawing placement cycle at part view "${view.name || "unnamed part view"}" on ${axis} axis`,
      )
    resolving[axis].add(view)
    const props = view._parsedProps
    const negative = axis === "x" ? props.leftOfRef : props.belowRef
    const positive = axis === "x" ? props.rightOfRef : props.aboveRef
    const selector = negative ?? positive
    let center = (axis === "x" ? props.centerX : props.centerY) ?? 0
    if (selector) {
      const matches = selectAll(preprocessSelector(selector, view), page, {
        adapter: cssSelectPrimitiveComponentAdapter,
      }).filter((child): child is AssemblyDrawingPartView =>
        views.includes(child as AssemblyDrawingPartView),
      )
      if (matches.length !== 1)
        throw new Error(
          `Part view "${view.name || "unnamed part view"}" placement selector "${selector}" matched ${matches.length} sibling views; expected exactly one`,
        )
      const reference = matches[0]!
      if (reference === view)
        throw new Error(
          `Part view "${view.name || "unnamed part view"}" cannot reference itself for placement`,
        )
      const size = axis === "x" ? props.width : props.height
      const referenceSize =
        axis === "x"
          ? reference._parsedProps.width
          : reference._parsedProps.height
      center =
        resolveAxis(reference, axis) +
        ((negative ? -1 : 1) * (size + referenceSize)) / 2
    }
    resolving[axis].delete(view)
    centers[axis].set(view, center)
    return center
  }
  return views.map((view) => ({
    view,
    center: { x: resolveAxis(view, "x"), y: resolveAxis(view, "y") },
  }))
}
