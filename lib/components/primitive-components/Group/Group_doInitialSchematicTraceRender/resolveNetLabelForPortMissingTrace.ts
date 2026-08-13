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

export const isDirectConnectionEndpointOutsideSchematicScope = ({
  db,
  sourcePortId,
  otherSourcePortId,
  sourcePortIdsInSchematicScope,
}: {
  db: NonNullable<Group<any>["root"]>["db"]
  sourcePortId: SourcePortId
  otherSourcePortId: SourcePortId
  sourcePortIdsInSchematicScope: Set<SourcePortId>
}) => {
  if (sourcePortIdsInSchematicScope.has(otherSourcePortId)) return false

  const sourcePort = db.source_port.get(sourcePortId)
  const otherSourcePort = db.source_port.get(otherSourcePortId)
  if (!sourcePort || !otherSourcePort) return false

  if (sourcePort.subcircuit_id !== otherSourcePort.subcircuit_id) return true

  const getSchematicSheetIds = (portId: SourcePortId) =>
    new Set(
      db.schematic_port
        .list({ source_port_id: portId })
        .map((schematicPort) =>
          schematicPort.schematic_component_id
            ? db.schematic_component.get(schematicPort.schematic_component_id)
                ?.schematic_sheet_id
            : undefined,
        )
        .filter((sheetId): sheetId is string => sheetId !== undefined),
    )

  const sourcePortSchematicSheetIds = getSchematicSheetIds(sourcePortId)
  const otherSourcePortSchematicSheetIds =
    getSchematicSheetIds(otherSourcePortId)

  return (
    sourcePortSchematicSheetIds.size > 0 &&
    otherSourcePortSchematicSheetIds.size > 0 &&
    sourcePortSchematicSheetIds.isDisjointFrom(otherSourcePortSchematicSheetIds)
  )
}

/**
 * Returns the other endpoint of a direct port-to-port trace when that endpoint
 * is not represented in the current schematic solver pass. Solver scope is
 * both group- and sheet-specific, so this covers cross-subcircuit and
 * cross-sheet connections.
 */
export const getDirectConnectionOutsideSchematicScopeSourcePortId = ({
  db,
  sourcePortId,
  sourcePortIdsInSchematicScope,
}: {
  db: NonNullable<Group<any>["root"]>["db"]
  sourcePortId: SourcePortId
  sourcePortIdsInSchematicScope: Set<SourcePortId>
}) => {
  if (!db.source_port.get(sourcePortId)) return undefined

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
    const typedOtherSourcePortId = asSourcePortId(otherSourcePortId)
    if (
      !isDirectConnectionEndpointOutsideSchematicScope({
        db,
        sourcePortId,
        otherSourcePortId: typedOtherSourcePortId,
        sourcePortIdsInSchematicScope,
      })
    ) {
      continue
    }

    return typedOtherSourcePortId
  }
}

export const resolveNetLabelForPortMissingTrace = ({
  group,
  sourcePortId,
  connectedSourcePortIdsForKey,
  sourcePortIdsInSchematicScope,
  connKey,
  sourceNet,
}: {
  group: Group<any>
  sourcePortId: SourcePortId
  connectedSourcePortIdsForKey: SourcePortId[]
  sourcePortIdsInSchematicScope: Set<SourcePortId>
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
  const directConnectionOutsideSchematicScopeSourcePortId =
    getDirectConnectionOutsideSchematicScopeSourcePortId({
      db,
      sourcePortId,
      sourcePortIdsInSchematicScope,
    })
  const directConnectionOutsideSchematicScopeLabelText =
    directConnectionOutsideSchematicScopeSourcePortId
      ? getSourcePortNetLabelText(
          db,
          directConnectionOutsideSchematicScopeSourcePortId,
        )
      : undefined

  return {
    text:
      sourceNet?.name ||
      sourceNet?.source_net_id ||
      assignedPortNetLabelText ||
      directConnectionOutsideSchematicScopeLabelText ||
      fallbackPortNetLabelText ||
      implicitPortLabelText ||
      connKey,
    wasAssignedDisplayLabel,
    directConnectionOutsideSchematicScopeSourcePortId,
  }
}
