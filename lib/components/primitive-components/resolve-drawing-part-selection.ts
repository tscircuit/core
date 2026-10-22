import { selectAll } from "css-select"
import type { DrawingPartView } from "circuit-json"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { preprocessSelector } from "../base-components/PrimitiveComponent/preprocessSelector"
import type { AssemblyDrawingPartView } from "./AssemblyDrawingPartView"
import { getAssemblyScope } from "./get-assembly-scope-components"

/** Resolve geometry in the nearest assembly device, preserving CAD world-space
 * points in mm (+Z up); selectors do not change the model's placement or frame.
 */
export function resolveDrawingPartSelection(
  view: AssemblyDrawingPartView,
): Pick<DrawingPartView, "source_group_id" | "source_component_ids"> {
  const selector = view._parsedProps.partRef
  const scope = getAssemblyScope(view)
  const matches = selectAll(preprocessSelector(selector, view), [scope], {
    adapter: cssSelectPrimitiveComponentAdapter,
  })
  if (matches.length !== 1)
    throw new Error(
      `Part view "${view.name || "unnamed part view"}" partRef "${selector}" matched ${matches.length} parts; expected exactly one`,
    )
  const target = matches[0]!
  if (target.source_group_id) return { source_group_id: target.source_group_id }
  const sourceComponentIds = [
    ...new Set(
      [target, ...target.getDescendants()].flatMap((part) =>
        part.source_component_id ? [part.source_component_id] : [],
      ),
    ),
  ]
  if (!sourceComponentIds.length)
    throw new Error(
      `Part view "${view.name || "unnamed part view"}" partRef "${selector}" has no source geometry`,
    )
  return { source_component_ids: sourceComponentIds }
}
