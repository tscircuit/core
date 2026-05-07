import type { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"

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
    const schPort = db.schematic_port.get(schOrSrcPortId)
    if (!schPort) continue
    if (schPort.is_connected) continue
    const srcPortId = schPortIdToSourcePortId.get(schOrSrcPortId)
    if (!srcPortId) continue

    const sourcePort = db.source_port.get(srcPortId)
    const key = sourcePort?.subcircuit_connectivity_map_key
    if (!key) continue
    const sourceNet = connKeyToNet.get(key)
    if (!sourceNet) {
      continue
    }

    const text = sourceNet.name || sourceNet.source_net_id || key
    const side =
      getEnteringEdgeFromDirection(
        (schPort.facing_direction as any) || "right",
      ) || "right"
    const center = computeSchematicNetLabelCenter({
      anchor_position: schPort.center,
      anchor_side: side as any,
      text,
    })

    const connectedPortCountForKey = Array.from(
      allSourceAndSchematicPortIdsInScope,
    ).filter((portId) => {
      const sourcePortId = schPortIdToSourcePortId.get(portId)
      if (!sourcePortId) return false
      return (
        db.source_port.get(sourcePortId)?.subcircuit_connectivity_map_key ===
        key
      )
    }).length

    if (connectedPortCountForKey <= 1) {
      const existingNetLabel = db.schematic_net_label.list().find((nl) => {
        if (sourceNet.source_net_id && nl.source_net_id) {
          return nl.source_net_id === sourceNet.source_net_id
        }
        return nl.text === (sourceNet.name || key)
      })
      if (existingNetLabel) {
        db.schematic_net_label.update(existingNetLabel.schematic_net_label_id, {
          text,
          anchor_position: schPort.center,
          center,
          anchor_side: side as any,
        })
        continue
      }
    }

    // Avoid duplicate labels at this port anchor position
    // Use a larger tolerance to account for placement discrepancy between
    // different net label algorithms (solver vs port-based placement)
    const existingAtPort = db.schematic_net_label.list().some((nl) => {
      const samePos =
        Math.abs(nl.anchor_position!.x - schPort.center.x) < 0.1 &&
        Math.abs(nl.anchor_position!.y - schPort.center.y) < 0.1
      if (!samePos) return false
      if (sourceNet.source_net_id && nl.source_net_id) {
        return nl.source_net_id === sourceNet.source_net_id
      }
      return nl.text === (sourceNet.name || key)
    })
    if (existingAtPort) continue

    // @ts-ignore
    db.schematic_net_label.insert({
      text,
      anchor_position: schPort.center,
      center,
      anchor_side: side as any,
      ...(sourceNet.source_net_id
        ? { source_net_id: sourceNet.source_net_id }
        : {}),
    })
  }
}
