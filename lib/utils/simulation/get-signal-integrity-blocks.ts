import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

/** Board-wide SI rules cross subcircuit boundaries, unlike scoped selectors. */
export function getSignalIntegrityBlocks(
  scope?: PrimitiveComponent,
): PcbTransientChannelSimulation[] {
  if (!scope || scope.shouldBeRemoved) return []
  if (scope.componentName === "PcbTransientChannelSimulation")
    return [scope as PcbTransientChannelSimulation]
  return scope.children.flatMap((child) => getSignalIntegrityBlocks(child))
}
