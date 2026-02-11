import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { Group } from "./Group"

/**
 * Renders this subcircuit in complete isolation using its own IsolatedCircuit
 * instance. The isolated circuit runs all render phases independently, then
 * the resulting Circuit JSON is inflated into class instances on the parent
 * group using the existing circuitJson inflation mechanism.
 */
export function Group_doInitialRenderIsolatedSubcircuits(
  group: Group<any>,
): void {
  if (!group._isIsolatedSubcircuit) return
  if (!group.root) return

  const parentRoot = group.root

  // Create an isolated circuit, passing the parent's platform config and flags.
  const isolatedCircuit = new IsolatedCircuit({
    platform: {
      ...parentRoot.platform,
      pcbDisabled: parentRoot.pcbDisabled,
      schematicDisabled: parentRoot.schematicDisabled,
    },
  })

  // Add children directly to the isolated circuit. The isolated circuit's
  // _guessRootComponent will wrap them in a Group(subcircuit: true) if needed.
  const childrenSnapshot = [...group.children]

  for (const child of childrenSnapshot) {
    isolatedCircuit.add(child)
  }

  // Queue an async effect so the parent circuit waits for the isolated
  // subcircuit to fully settle (including async effects like autorouting)
  // before proceeding to subsequent render phases.
  group._queueAsyncEffect("render-isolated-subcircuit", async () => {
    await isolatedCircuit.renderUntilSettled()

    const isolatedElements = isolatedCircuit.getCircuitJson()

    // Clear original children before inflation — inflateCircuitJson
    // throws if both circuitJson and children are present.
    group.children = []
    group._normalComponentNameMap = null

    // Inflate the isolated circuit JSON into class instances on the
    // group, reusing the existing circuitJson inflation mechanism.
    // Dynamic import to avoid circular dependency (inflators reference Group).
    const { inflateCircuitJson } = await import(
      "lib/utils/circuit-json/inflate-circuit-json"
    )
    group._isInflatedFromCircuitJson = true
    inflateCircuitJson(group, isolatedElements, [])
  })
}
