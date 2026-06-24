import type { Group } from "lib/components"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import type { SourceNet } from "circuit-json"

const NEAR_EXISTING_NET_LABEL_DISTANCE = 0.5
const SAME_ANCHOR_POSITION_DISTANCE = 0.1

const doesSchematicNetLabelRepresentCurrentSourceConnection = (args: {
  nl: { source_net_id?: string | null; text?: string }
  connKey: string
  sourceNet?: SourceNet
  text: string
}) => {
  const { nl, connKey, sourceNet, text } = args

  if (sourceNet?.source_net_id && nl.source_net_id) {
    return nl.source_net_id === sourceNet.source_net_id
  }

  if (nl.source_net_id) {
    return nl.source_net_id === connKey
  }

  return nl.text === text
}

const getSourcePortNetLabelText = (
  db: NonNullable<Group<any>["root"]>["db"],
  sourcePortId: string,
) => {
  const sourcePort = db.source_port.get(sourcePortId)
  if (!sourcePort) return undefined

  let sourceComponent: ReturnType<typeof db.source_component.get> | undefined
  if (sourcePort.source_component_id) {
    sourceComponent = db.source_component.get(sourcePort.source_component_id)
  }

  if (!sourceComponent?.name || !sourcePort.name) return undefined

  return `${sourceComponent.name}_${sourcePort.name}`
}

const getDirectCrossSubcircuitConnectionLabelText = (
  db: NonNullable<Group<any>["root"]>["db"],
  sourcePortId: string,
) => {
  const sourcePort = db.source_port.get(sourcePortId)
  if (!sourcePort) return undefined

  for (const sourceTrace of db.source_trace.list()) {
    const connectedSourcePortIds = sourceTrace.connected_source_port_ids ?? []
    if (connectedSourcePortIds.length !== 2) continue
    if ((sourceTrace.connected_source_net_ids ?? []).length > 0) continue
    if (!connectedSourcePortIds.includes(sourcePortId)) continue

    const otherSourcePortId = connectedSourcePortIds.find(
      (portId) => portId !== sourcePortId,
    )
    if (!otherSourcePortId) continue

    const otherSourcePort = db.source_port.get(otherSourcePortId)
    if (!otherSourcePort) continue
    if (otherSourcePort.subcircuit_id === sourcePort.subcircuit_id) continue

    return getSourcePortNetLabelText(db, otherSourcePortId)
  }
}

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

    const connectedSourcePortIdsForKey = Array.from(
      allSourceAndSchematicPortIdsInScope,
    )
      .map((portId) => schPortIdToSourcePortId.get(portId))
      .filter((sourcePortId): sourcePortId is string => {
        if (!sourcePortId) return false
        return (
          db.source_port.get(sourcePortId)?.subcircuit_connectivity_map_key ===
          connKey
        )
      })

    const implicitPortLabelText = connectedSourcePortIdsForKey
      .map((sourcePortId) => getSourcePortNetLabelText(db, sourcePortId))
      .filter((label): label is string => Boolean(label))
      .join("/")

    const directCrossSubcircuitConnectionLabelText =
      getDirectCrossSubcircuitConnectionLabelText(db, srcPortId)

    const text =
      sourceNet?.name ||
      sourceNet?.source_net_id ||
      directCrossSubcircuitConnectionLabelText ||
      implicitPortLabelText ||
      connKey

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
    const isGndNet = sourceNet?.is_ground ?? false
    const isPowerNet = !isGndNet && (sourceNet?.is_power ?? false)
    let side: "top" | "bottom" | "left" | "right"
    if (isGndNet) {
      side = "top"
    } else if (isPowerNet) {
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

    const existingNetLabelForCurrentSourceConnection = db.schematic_net_label
      .list()
      .find((nl) => {
        return doesSchematicNetLabelRepresentCurrentSourceConnection({
          nl,
          connKey,
          sourceNet,
          text,
        })
      })

    if (
      existingNetLabelForCurrentSourceConnection &&
      connectedPortCountForKey <= 1
    ) {
      db.schematic_net_label.update(
        existingNetLabelForCurrentSourceConnection.schematic_net_label_id,
        {
          text,
          anchor_position: schPort.center,
          center,
          anchor_side: side,
        },
      )
      continue
    }

    if (existingNetLabelForCurrentSourceConnection) {
      const dx =
        existingNetLabelForCurrentSourceConnection.anchor_position!.x -
        schPort.center.x
      const dy =
        existingNetLabelForCurrentSourceConnection.anchor_position!.y -
        schPort.center.y
      const labelIsNearPort =
        dx * dx + dy * dy <
        NEAR_EXISTING_NET_LABEL_DISTANCE * NEAR_EXISTING_NET_LABEL_DISTANCE

      if (labelIsNearPort) {
        if (isGndNet) {
          db.schematic_net_label.update(
            existingNetLabelForCurrentSourceConnection.schematic_net_label_id,
            {
              text,
              anchor_position: schPort.center,
              center,
              anchor_side: side,
            },
          )
        } else if (
          !isPowerNet &&
          existingNetLabelForCurrentSourceConnection.text === text
        ) {
          const anchor_side =
            existingNetLabelForCurrentSourceConnection.anchor_side ?? side
          db.schematic_net_label.update(
            existingNetLabelForCurrentSourceConnection.schematic_net_label_id,
            {
              text,
              anchor_position: schPort.center,
              center: computeSchematicNetLabelCenter({
                anchor_position: schPort.center,
                anchor_side,
                text,
              }),
              anchor_side,
            },
          )
        }
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
        return doesSchematicNetLabelRepresentCurrentSourceConnection({
          nl,
          connKey,
          sourceNet,
          text,
        })
      })
      if (existingAtPort) continue
    }

    if (!sourceNet) {
      for (const nl of db.schematic_net_label.list()) {
        if (nl.source_net_id !== connKey) continue

        const isAttachedToConnectedPort = connectedSourcePortIdsForKey.some(
          (sourcePortId) => {
            const schPortId = Array.from(
              schPortIdToSourcePortId.entries(),
            ).find(([, id]) => id === sourcePortId)?.[0]
            let connectedSchPort:
              | ReturnType<typeof db.schematic_port.get>
              | undefined
            if (schPortId) {
              connectedSchPort = db.schematic_port.get(schPortId)
            }
            if (!connectedSchPort?.center || !nl.anchor_position) return false

            const dx = nl.anchor_position.x - connectedSchPort.center.x
            const dy = nl.anchor_position.y - connectedSchPort.center.y
            return (
              dx * dx + dy * dy <
              SAME_ANCHOR_POSITION_DISTANCE * SAME_ANCHOR_POSITION_DISTANCE
            )
          },
        )

        if (!isAttachedToConnectedPort) {
          db.schematic_net_label.delete(nl.schematic_net_label_id)
        }
      }
    }

    const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
      text,
      source_net_id: sourceNet?.source_net_id ?? connKey,
      anchor_position: schPort.center,
      center,
      anchor_side: side,
    }
    db.schematic_net_label.insert(netLabel)
  }
}
