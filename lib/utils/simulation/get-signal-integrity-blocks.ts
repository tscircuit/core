import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"
import { SimulationEyeDiagram } from "lib/components/primitive-components/SimulationEyeDiagram"

/** Board-wide SI rules cross subcircuit boundaries, unlike scoped selectors. */
function getSignalIntegrityDeclarations<T extends PrimitiveComponent>(
  scope: PrimitiveComponent | undefined,
  matches: (declaration: PrimitiveComponent) => declaration is T,
): T[] {
  if (!scope || scope.shouldBeRemoved) return []
  if (matches(scope)) return [scope]
  return scope.children.flatMap((child) =>
    getSignalIntegrityDeclarations(child, matches),
  )
}

export function getSignalIntegrityBlocks(scope?: PrimitiveComponent) {
  return getSignalIntegrityDeclarations(
    scope,
    (declaration) => declaration instanceof PcbTransientChannelSimulation,
  )
}

export function getSignalIntegrityEyes(scope?: PrimitiveComponent) {
  return getSignalIntegrityDeclarations(
    scope,
    (declaration) => declaration instanceof SimulationEyeDiagram,
  )
}
