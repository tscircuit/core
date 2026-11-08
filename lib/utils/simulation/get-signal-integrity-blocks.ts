import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { SignalIntegrity } from "lib/components/primitive-components/SignalIntegrity"

/** Board-wide SI rules cross subcircuit boundaries, unlike scoped selectors. */
export function getSignalIntegrityBlocks(
  scope?: PrimitiveComponent,
): SignalIntegrity[] {
  if (!scope || scope.shouldBeRemoved) return []
  if (scope.componentName === "SignalIntegrity")
    return [scope as SignalIntegrity]
  return scope.children.flatMap((child) => getSignalIntegrityBlocks(child))
}
