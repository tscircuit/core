import type { PrimitiveComponent } from "lib/components"
import type { Primitive } from "schematic-symbols/drawing/types"

import { isMatchingSelector } from "./is-matching-selector"

/**
 * Determines if a component matches a path selector, meaning that the last
 * selector matches the current component, and the previous selectors match
 * the parent components.
 */
export function isMatchingPathSelector(
  component: PrimitiveComponent,
  selector: string,
): boolean {
  const selectorParts = selector.split(/\> /g).map((part) => part.trim())
  let currentComponent: PrimitiveComponent | null = component

  // Iterate through selector parts from right to left
  for (let i = selectorParts.length - 1; i >= 0; i--) {
    if (!currentComponent) return false

    if (!isMatchingSelector(currentComponent, selectorParts[i])) {
      return false
    }

    // Move to the parent component for the next iteration
    currentComponent = currentComponent.parent
  }

  // If we've matched all parts of the selector, it's a match
  return true
}
