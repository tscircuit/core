import type { PrimitiveComponent } from "lib/components"
import type { Primitive } from "schematic-symbols/drawing/types"

/**
 * Determines if a component matches a path selector, meaning that the last
 * selector matches the current component, and the previous selectors match
 * the parent components.
 */
export function isMatchingPathSelector(
  component: PrimitiveComponent,
  selector: string,
): boolean {
  // TODO
}
