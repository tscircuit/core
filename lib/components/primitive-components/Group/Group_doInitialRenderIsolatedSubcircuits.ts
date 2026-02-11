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

  // Queue an async effect so the parent circuit waits for the isolated
  // subcircuit to fully settle (including async effects like autorouting)
  // before proceeding to subsequent render phases.
  group._queueAsyncEffect("render-isolated-subcircuit", async () => {
    await isolatedCircuit.renderUntilSettled()

    const isolatedElements = isolatedCircuit.getCircuitJson()

    // Clear original children before inflation
    group.children = []
    group._normalComponentNameMap = null

    const { inflateCircuitJson } = await import(
      "lib/utils/circuit-json/inflate-circuit-json"
    )
    group._isInflatedFromCircuitJson = true
    inflateCircuitJson(group, isolatedElements, [])
  })
}
