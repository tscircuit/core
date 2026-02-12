import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Group } from "./Group"

/**
 * Drives one render cycle of the group's isolated circuit. On the first call,
 * creates the IsolatedCircuit and moves the group's children into it. On each
 * call, runs one render cycle. Returns true once the isolated circuit has
 * settled and its results are ready to be inflated.
 */
export function Group_doInitialRenderIsolatedSubcircuits(
  group: Group<any>,
): boolean {
  if (!group._isolatedCircuit) {
    const parentRoot = group.root!

    group._isolatedCircuit = new IsolatedCircuit({
      platform: {
        ...parentRoot.platform,
        pcbDisabled: parentRoot.pcbDisabled,
        schematicDisabled: parentRoot.schematicDisabled,
      },
    })

    for (const child of group.children) {
      group._isolatedCircuit.add(child)
    }
  }

  group._isolatedCircuit.render()

  if (group._isolatedCircuit._hasIncompleteAsyncEffects()) {
    return false
  }

  group._isolatedCircuitJson = group._isolatedCircuit.getCircuitJson()
  group.children = []
  group._normalComponentNameMap = null
  group._isolatedCircuit = null

  return true
}
