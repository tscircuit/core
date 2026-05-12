import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"

export const insertNetLabelsForPortsMissingTrace = ({
  allSourceAndSchematicPortIdsInScope,
  group,
  schPortIdToSourcePortId,
  sckToSourceNet: connKeyToNet,
}: {
  group: Group<any>
  allSourceAndSchematicPortIdsInScope: Set<string>
  schPortIdToSourcePortId: Map<string, string>
  sckToSourceNet: Map<string, any>
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
    const netName = sourceNet.name || ""
    const isGndNet = sourceNet.is_ground || /^(gnd|vee|vss)/i.test(netName)
    const isPowerNet = !isGndNet && (sourceNet.is_power || /^v/i.test(netName))
    const usePowerSymbolSide = connectedPortCountForKey > 1
    const side: "top" | "bottom" | "left" | "right" =
      usePowerSymbolSide && isGndNet
        ? "top"
        : usePowerSymbolSide && isPowerNet
          ? "bottom"
          : getEnteringEdgeFromDirection(
              (schPort.facing_direction as any) || "right",
            ) || "right"
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
      const labelIsNearPort = dx * dx + dy * dy < 0.5 * 0.5
      const shouldAnchorExistingLabel =
        text === "GND" &&
        (sourcePort.name === "GND" ||
          (sourcePort as any).pin_label === "GND" ||
          sourcePort.port_hints?.includes("GND"))

      if (labelIsNearPort && shouldAnchorExistingLabel) {
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
        if (dx * dx + dy * dy >= 0.1 * 0.1) return false
        if (sourceNet.source_net_id && nl.source_net_id) {
          return nl.source_net_id === sourceNet.source_net_id
        }
        return nl.text === (sourceNet.name || key)
      })
      if (existingAtPort) continue
    }

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
