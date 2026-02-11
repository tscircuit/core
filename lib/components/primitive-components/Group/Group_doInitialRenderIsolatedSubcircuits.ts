import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { mergeIsolatedCircuitJson } from "lib/utils/circuit-json/merge-isolated-circuit-json"
import type { Group } from "./Group"

/**
 * Renders this subcircuit in complete isolation using its own IsolatedCircuit
 * instance. The isolated circuit runs all render phases independently, then
 * the resulting Circuit JSON is merged into the parent circuit's database.
 *
 * After this, child rendering in subsequent phases is skipped because all
 * circuit JSON has already been produced by the isolated render.
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

    // Merge into the main db with a unique prefix to avoid ID conflicts
    const idPrefix = `isolated_${group.name ?? group._renderId}_`
    mergeIsolatedCircuitJson(parentRoot.db, isolatedElements, idPrefix)

    // Extract the top-level source_group, pcb_group, and schematic_group IDs
    // from the merged output so the parent can reference this subcircuit
    for (const element of isolatedElements) {
      if (element.type === "source_group" && element.is_subcircuit === true) {
        group.source_group_id = `${idPrefix}${element.source_group_id}`
        group.subcircuit_id = element.subcircuit_id
          ? `${idPrefix}${element.subcircuit_id}`
          : null
        break
      }
    }

    for (const element of isolatedElements) {
      if (element.type === "pcb_group" && element.is_subcircuit === true) {
        group.pcb_group_id = `${idPrefix}${element.pcb_group_id}`
        break
      }
    }

    for (const element of isolatedElements) {
      if (
        element.type === "schematic_group" &&
        element.is_subcircuit === true
      ) {
        group.schematic_group_id = `${idPrefix}${element.schematic_group_id}`
        break
      }
    }
  })
}
