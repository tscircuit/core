import type { Renderable } from "lib/components/base-components/Renderable"

/** A shared routing batch can outlive one removed descendant's waiter. */
export function isActiveRoutingDescendant(context: {
  descendant: Renderable
  ancestor: Renderable
}) {
  for (
    let owner: Renderable | null = context.descendant;
    owner;
    owner = owner.parent
  ) {
    if (owner.shouldBeRemoved) return false
    if (owner === context.ancestor) return true
  }
  return false
}
