import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Group } from "./Group"

/**
 * Renders this subcircuit in complete isolation using its own IsolatedCircuit
 * instance. The isolated circuit runs all render phases independently, then
 * the resulting Circuit JSON is stored on the group for the existing
 * InflateSubcircuitCircuitJson phase to pick up and inflate.
 */
export function Group_doInitialRenderIsolatedSubcircuits(
  group: Group<any>,
): void {
  if (!group._isIsolatedSubcircuit) return
  if (!group.root) return

  const parentRoot = group.root

  const isolatedCircuit = new IsolatedCircuit({
    platform: {
      ...parentRoot.platform,
      pcbDisabled: parentRoot.pcbDisabled,
      schematicDisabled: parentRoot.schematicDisabled,
    },
  })

  const childrenSnapshot = [...group.children]

  for (const child of childrenSnapshot) {
    isolatedCircuit.add(child)
  }

  group._queueAsyncEffect("render-isolated-subcircuit", async () => {
    await isolatedCircuit.renderUntilSettled()

    group.children = []
    group._normalComponentNameMap = null
    group._isolatedCircuitJson = isolatedCircuit.getCircuitJson()
  })
}
