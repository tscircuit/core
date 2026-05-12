import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import type { SchematicLabelAnchorSide } from "lib/utils/schematic/netLabelUtils"
import type { SchematicNetLabel, SourceNet } from "circuit-json"

const NEAR_EXISTING_NET_LABEL_DISTANCE = 0.5
const SAME_ANCHOR_POSITION_DISTANCE = 0.1

export const insertNetLabelsForPortsMissingTrace = ({
  allSourceAndSchematicPortIdsInScope,
  group,
  schPortIdToSourcePortId,
  connKeyToSourceNet,
}: {
  group: Group<any>
  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
  connKeyToSourceNet: Map<string, SourceNet>
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
    const sourceNet = connKeyToSourceNet.get(key)
    if (!sourceNet) {
      continue
    }

    const text = sourceNet.name || sourceNet.source_net_id || key
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
    const isGndNet = sourceNet.is_ground
    const isPowerNet = !isGndNet && sourceNet.is_power
    const usePowerSymbolSide = connectedPortCountForKey > 1
    let side: SchematicLabelAnchorSide
    if (usePowerSymbolSide && isGndNet) {
      side = "top"
    } else if (usePowerSymbolSide && isPowerNet) {
      side = "bottom"
    } else {
      side =
        getEnteringEdgeFromDirection(
          (schPort.facing_direction as any) || "right",
        ) || "right"
    }
    const center = computeSchematicNetLabelCenter({
      anchor_position: schPort.center,
      anchor_side: side as any,
      text,
    })

    const sameNetLabel = db.schematic_net_label.list().find((nl) => {
      if (sourceNet.source_net_id && nl.source_net_id) {
        return nl.source_net_id === sourceNet.source_net_id
      }
      return nl.text === (sourceNet.name || key)
    })

    if (sameNetLabel && connectedPortCountForKey <= 1) {
      db.schematic_net_label.update(sameNetLabel.schematic_net_label_id, {
        text,
        anchor_position: schPort.center,
        center,
        anchor_side: side as any,
      })
      continue
    }

    if (sameNetLabel) {
      const dx = sameNetLabel.anchor_position!.x - schPort.center.x
      const dy = sameNetLabel.anchor_position!.y - schPort.center.y
      const labelIsNearPort =
        dx * dx + dy * dy <
        NEAR_EXISTING_NET_LABEL_DISTANCE * NEAR_EXISTING_NET_LABEL_DISTANCE

      if (labelIsNearPort && sourceNet.is_ground) {
        db.schematic_net_label.update(sameNetLabel.schematic_net_label_id, {
          text,
          anchor_position: schPort.center,
          center,
          anchor_side: side as any,
        })
        continue
      }

      const existingAtPort = db.schematic_net_label.list().some((nl) => {
        const dx = nl.anchor_position!.x - schPort.center.x
        const dy = nl.anchor_position!.y - schPort.center.y
        if (
          dx * dx + dy * dy >=
          SAME_ANCHOR_POSITION_DISTANCE * SAME_ANCHOR_POSITION_DISTANCE
        ) {
          return false
        }
        if (sourceNet.source_net_id && nl.source_net_id) {
          return nl.source_net_id === sourceNet.source_net_id
        }
        return nl.text === (sourceNet.name || key)
      })
      if (existingAtPort) continue
    }

    const netLabel = {
      text,
      anchor_position: schPort.center,
      center,
      anchor_side: side as any,
    } satisfies Partial<SchematicNetLabel>
    if (sourceNet.source_net_id) {
      Object.assign(netLabel, { source_net_id: sourceNet.source_net_id })
    }
    db.schematic_net_label.insert(
      netLabel as Parameters<typeof db.schematic_net_label.insert>[0],
    )
  }
}
