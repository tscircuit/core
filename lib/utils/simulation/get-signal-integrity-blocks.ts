import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { SignalIntegritySimulation } from "lib/components/primitive-components/SignalIntegritySimulation"

/** Board-wide SI rules cross subcircuit boundaries, unlike scoped selectors. */
export function getSignalIntegrityBlocks(
  scope?: PrimitiveComponent,
): SignalIntegritySimulation[] {
  if (!scope || scope.shouldBeRemoved) return []
  if (scope.componentName === "SignalIntegritySimulation")
    return [scope as SignalIntegritySimulation]
  return scope.children.flatMap((child) => getSignalIntegrityBlocks(child))
}
