import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import type { Port } from "../../Port"
import type { SourceNet } from "circuit-json"

const NEAR_EXISTING_NET_LABEL_DISTANCE = 0.5
const SAME_ANCHOR_POSITION_DISTANCE = 0.1
// Slightly larger than SAME_ANCHOR_POSITION_DISTANCE to catch labels placed
// slightly offset from port centers (e.g. trace-anchored labels)
const PORT_LABEL_PROXIMITY_DISTANCE = 0.25

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
    const connKey = sourcePort?.subcircuit_connectivity_map_key
    if (!connKey) continue
    const sourceNet = connKeyToSourceNet.get(connKey)
    if (!sourceNet) {
      // No explicit source_net (e.g. connections made via the `connections`
      // prop without a named <net>). Derive label text from connected ports.
      const portsOnSameNet = group
        .selectAll<Port>("port")
        .filter((p: Port) => p._getSubcircuitConnectivityKey() === connKey)
      if (portsOnSameNet.length === 0) continue

      const { name: text } = getNetNameFromPorts(portsOnSameNet)
      const side =
        getEnteringEdgeFromDirection(
          (schPort.facing_direction as any) || "right",
        ) || "right"
      const center = computeSchematicNetLabelCenter({
        anchor_position: schPort.center,
        anchor_side: side,
        text,
      })

      // If solver placed a same-net label near this port (possibly with wrong
      // anchor due to trace routing), fix it in place rather than duplicating
      const sameNetLabelNearPort = db.schematic_net_label.list().find((nl) => {
        if (nl.source_net_id !== connKey) return false
        const dx = (nl.anchor_position?.x ?? 0) - schPort.center.x
        const dy = (nl.anchor_position?.y ?? 0) - schPort.center.y
        return (
          dx * dx + dy * dy <
          PORT_LABEL_PROXIMITY_DISTANCE * PORT_LABEL_PROXIMITY_DISTANCE
        )
      })
      if (sameNetLabelNearPort) {
        db.schematic_net_label.update(
          sameNetLabelNearPort.schematic_net_label_id,
          { anchor_position: schPort.center, center, anchor_side: side },
        )
        continue
      }

      // Skip if any label already sits exactly at this port position
      const hasLabelAtPort = db.schematic_net_label.list().some((nl) => {
        const dx = (nl.anchor_position?.x ?? 0) - schPort.center.x
        const dy = (nl.anchor_position?.y ?? 0) - schPort.center.y
        return (
          dx * dx + dy * dy <
          SAME_ANCHOR_POSITION_DISTANCE * SAME_ANCHOR_POSITION_DISTANCE
        )
      })
      if (hasLabelAtPort) continue

      db.schematic_net_label.insert({
        text,
        source_net_id: connKey,
        anchor_position: schPort.center,
        center,
        anchor_side: side,
      })
      continue
    }

    const text = sourceNet.name || sourceNet.source_net_id || connKey
    const connectedPortCountForKey = Array.from(
      allSourceAndSchematicPortIdsInScope,
    ).filter((portId) => {
      const sourcePortId = schPortIdToSourcePortId.get(portId)
      if (!sourcePortId) return false
      return (
        db.source_port.get(sourcePortId)?.subcircuit_connectivity_map_key ===
        connKey
      )
    }).length
    const isGndNet = sourceNet.is_ground
    const isPowerNet = !isGndNet && sourceNet.is_power
    const usePowerSymbolSide = connectedPortCountForKey > 1
    let side: "top" | "bottom" | "left" | "right"
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
      anchor_side: side,
      text,
    })

    const sameNetLabel = db.schematic_net_label.list().find((nl) => {
      if (sourceNet.source_net_id && nl.source_net_id) {
        return nl.source_net_id === sourceNet.source_net_id
      }
      return nl.text === (sourceNet.name || connKey)
    })

    if (sameNetLabel && connectedPortCountForKey <= 1) {
      db.schematic_net_label.update(sameNetLabel.schematic_net_label_id, {
        text,
        anchor_position: schPort.center,
        center,
        anchor_side: side,
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
          anchor_side: side,
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
        return nl.text === (sourceNet.name || connKey)
      })
      if (existingAtPort) continue
    }

    const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
      text,
      source_net_id: sourceNet.source_net_id,
      anchor_position: schPort.center,
      center,
      anchor_side: side,
    }
    db.schematic_net_label.insert(netLabel)
  }
}
