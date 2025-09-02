import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { isPowerOrGroundNetLabel } from "lib/utils/schematic/isPowerOrGroundNetLabel"

export const insertNetLabelsForPortsMissingTrace = ({
  allSourceAndSchematicPortIdsInScope,
  group,
  schPortIdToSourcePortId,
  sckToSourceNet: connKeyToNet,
  pinIdToSchematicPortId,
  schematicPortIdsWithPreExistingNetLabels,
}: {
  group: Group<any>
  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
  sckToSourceNet: Map<string, any>
  pinIdToSchematicPortId: Map<string, string>
  schematicPortIdsWithPreExistingNetLabels: Set<string>
}) => {
  const { db } = group.root!

  // Create net labels for ports connected only to a net (no trace connected)
  for (const schOrSrcPortId of Array.from(
    allSourceAndSchematicPortIdsInScope,
  )) {
    const sp = db.schematic_port.get(schOrSrcPortId)
    if (!sp) continue
    if (sp.is_connected) continue
    const srcPortId = schPortIdToSourcePortId.get(schOrSrcPortId)
    if (!srcPortId) continue

    const sourcePort = db.source_port.get(srcPortId)
    const key = sourcePort?.subcircuit_connectivity_map_key
    if (!key) continue
    const sourceNet = connKeyToNet.get(key)
    if (!sourceNet) {
      continue
    }

    // Avoid duplicate labels at this port anchor position
    // Use a larger tolerance to account for placement discrepancy between
    // different net label algorithms (solver vs port-based placement)
    const existingAtPort = db.schematic_net_label.list().some((nl) => {
      const samePos =
        Math.abs(nl.anchor_position!.x - sp.center.x) < 0.1 &&
        Math.abs(nl.anchor_position!.y - sp.center.y) < 0.1
      if (!samePos) return false
      if (sourceNet.source_net_id && nl.source_net_id) {
        return nl.source_net_id === sourceNet.source_net_id
      }
      return nl.text === (sourceNet.name || key)
    })
    if (existingAtPort) continue

    const text = sourceNet.name || sourceNet.source_net_id || key
    let side =
      getEnteringEdgeFromDirection((sp.facing_direction as any) || "right") ||
      "right"

    // Prefer horizontal label orientation for non-power nets
    const isPowerOrGroundNet = isPowerOrGroundNetLabel(text)
    if (!isPowerOrGroundNet && (side === "top" || side === "bottom")) {
      side = "right"
    }
    const center = computeSchematicNetLabelCenter({
      anchor_position: sp.center,
      anchor_side: side as any,
      text,
    })
    // @ts-ignore
    db.schematic_net_label.insert({
      text,
      anchor_position: sp.center,
      center,
      anchor_side: side as any,
      ...(sourceNet.source_net_id
        ? { source_net_id: sourceNet.source_net_id }
        : {}),
    })
  }
}
