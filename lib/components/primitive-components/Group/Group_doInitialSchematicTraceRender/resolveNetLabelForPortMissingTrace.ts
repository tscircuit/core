import type { SourceNet, SourcePort } from "circuit-json"
import type { Group } from "lib/components"
import {
  getNetNameFromSourcePorts,
  getSourcePortNetLabelText,
} from "lib/utils/schematic/getSourcePortNetLabelText"
import type { Port } from "../../Port"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import { type SourcePortId, asSourcePortId } from "./port-id-types"

type SubcircuitConnectivityMapKey = NonNullable<
  SourcePort["subcircuit_connectivity_map_key"]
>

export const getDirectCrossSubcircuitConnectedSourcePortId = (
  db: NonNullable<Group<any>["root"]>["db"],
  sourcePortId: SourcePortId,
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

    return asSourcePortId(otherSourcePortId)
  }
}

export const resolveNetLabelForPortMissingTrace = ({
  group,
  sourcePortId,
  connectedSourcePortIdsForKey,
  connKey,
  sourceNet,
}: {
  group: Group<any>
  sourcePortId: SourcePortId
  connectedSourcePortIdsForKey: SourcePortId[]
  connKey: SubcircuitConnectivityMapKey
  sourceNet?: SourceNet
}) => {
  const { db } = group.root!
  const connectedPortsForKey = group
    .selectAll<Port>("port")
    .filter((port) => port._getSubcircuitConnectivityKey() === connKey)
  const { name: resolvedPortNetLabelText, wasAssignedDisplayLabel } =
    getNetNameFromPorts(connectedPortsForKey)
  const assignedPortNetLabelText = wasAssignedDisplayLabel
    ? resolvedPortNetLabelText
    : undefined
  const fallbackPortNetLabelText = wasAssignedDisplayLabel
    ? undefined
    : resolvedPortNetLabelText || undefined
  const implicitPortLabelText = getNetNameFromSourcePorts(
    db,
    connectedSourcePortIdsForKey,
  )
  const directCrossSubcircuitConnectedSourcePortId =
    getDirectCrossSubcircuitConnectedSourcePortId(db, sourcePortId)
  const directCrossSubcircuitConnectionLabelText =
    directCrossSubcircuitConnectedSourcePortId
      ? getSourcePortNetLabelText(
          db,
          directCrossSubcircuitConnectedSourcePortId,
        )
      : undefined

  return {
    text:
      sourceNet?.name ||
      sourceNet?.source_net_id ||
      assignedPortNetLabelText ||
      directCrossSubcircuitConnectionLabelText ||
      fallbackPortNetLabelText ||
      implicitPortLabelText ||
      connKey,
    wasAssignedDisplayLabel,
    directCrossSubcircuitConnectedSourcePortId,
  }
}
