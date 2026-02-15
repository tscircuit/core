import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Subcircuit } from "./Subcircuit"

/**
 * Renders the subcircuit's children in isolation and extracts the circuit JSON.
 * If a cached result exists for the same prop hash, uses that instead.
 *
 * This function queues an async effect that renders the isolated circuit and
 * waits for all async effects (like autorouting) to complete before storing
 * the result in the cache.
 */
export function Subcircuit_doInitialRenderIsolatedSubcircuits(
  subcircuit: Subcircuit,
): void {
  if (!subcircuit._isIsolatedSubcircuit) return

  // Skip if already has isolated circuit JSON
  if (subcircuit._isolatedCircuitJson) return

  // Check global cache first
  const propHash = subcircuit.getSubcircuitPropHash()
  const cachedSubcircuits = subcircuit.root?.cachedSubcircuits
  const cached = cachedSubcircuits?.get(propHash)

  if (cached) {
    // Cache hit - use cached circuit JSON directly
    subcircuit._isolatedCircuitJson = cached
    subcircuit.children = []
    subcircuit._normalComponentNameMap = null
    return
  }

  // Cache miss - render in isolation using an async effect
  const parentRoot = subcircuit.root!

  // Capture children before clearing them
  const childrenToRender = [...subcircuit.children]

  // Clear children immediately so they don't render in the parent circuit
  subcircuit.children = []
  subcircuit._normalComponentNameMap = null

  subcircuit._queueAsyncEffect("render-isolated-subcircuit", async () => {
    const isolatedCircuit = new IsolatedCircuit({
      platform: {
        ...parentRoot.platform,
        pcbDisabled: parentRoot.pcbDisabled,
        schematicDisabled: parentRoot.schematicDisabled,
      },
      cachedSubcircuits,
    })

    for (const child of childrenToRender) {
      isolatedCircuit.add(child)
    }

    // Use renderUntilSettled to properly wait for all async effects
    await isolatedCircuit.renderUntilSettled()

    const circuitJson = isolatedCircuit.getCircuitJson()

    // Store in global cache for future subcircuits with same props
    cachedSubcircuits?.set(propHash, circuitJson)

    subcircuit._isolatedCircuitJson = circuitJson
  })
}
