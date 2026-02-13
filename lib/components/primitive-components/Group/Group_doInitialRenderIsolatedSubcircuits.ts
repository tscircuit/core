import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Group } from "./Group"

/**
 * Drives one render cycle of the group's isolated circuit. On the first call,
 * creates the IsolatedCircuit and moves the group's children into it. On each
 * call, runs one render cycle. Returns true once the isolated circuit has
 * settled and its results are ready to be inflated.
 *
 * Cache key computation and cache lookups are handled by the caller
 * (Group.runRenderPhaseForChildren or Group.runRenderCycle). This function
 * only handles the isolated rendering pipeline. When the render settles, the
 * caller is responsible for extracting the circuit JSON and storing it in the
 * cache.
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

  // Isolated render settled — extract results
  const circuitJson = group._isolatedCircuit.getCircuitJson()
  group._isolatedCircuitJson = circuitJson

  // Store in cache if a cache key was set by the caller
  if (group._subcircuitCacheKey && group.root) {
    group.root._cachedSubcircuitCircuitJson.set(
      group._subcircuitCacheKey,
      circuitJson,
    )
  }

  group.children = []
  group._normalComponentNameMap = null
  group._isolatedCircuit = null

  return true
}
