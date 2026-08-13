import type { SchematicSheet, SourceNet, SourcePort } from "circuit-json"
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
type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

export const isDirectConnectionEndpointOutsideSchematicScope = ({
  db,
  sourcePortId,
  otherSourcePortId,
  sourcePortIdsInSchematicScope,
  schematicSheetId,
}: {
  db: NonNullable<Group<any>["root"]>["db"]
  sourcePortId: SourcePortId
  otherSourcePortId: SourcePortId
  sourcePortIdsInSchematicScope: Set<SourcePortId>
  schematicSheetId?: SchematicSheetId
}) => {
  if (sourcePortIdsInSchematicScope.has(otherSourcePortId)) return false

  const sourcePort = db.source_port.get(sourcePortId)
  const otherSourcePort = db.source_port.get(otherSourcePortId)
  if (!sourcePort || !otherSourcePort) return false

  if (sourcePort.subcircuit_id !== otherSourcePort.subcircuit_id) return true
  if (!schematicSheetId) return false

  const otherEndpointSchematicPorts = db.schematic_port.list({
    source_port_id: otherSourcePortId,
  })
  const hasOtherEndpointOnCurrentSheet = otherEndpointSchematicPorts.some(
    (schematicPort) => schematicPort.schematic_sheet_id === schematicSheetId,
  )
  if (hasOtherEndpointOnCurrentSheet) return false

  return otherEndpointSchematicPorts.some(
    (schematicPort) => schematicPort.schematic_sheet_id !== undefined,
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
  schematicSheetId,
}: {
  db: NonNullable<Group<any>["root"]>["db"]
  sourcePortId: SourcePortId
  sourcePortIdsInSchematicScope: Set<SourcePortId>
  schematicSheetId?: SchematicSheetId
}) => {
  if (!db.source_port.get(sourcePortId)) return undefined

  for (const sourceTrace of db.source_trace.list()) {
    const connectedSourcePortIds = (
      sourceTrace.connected_source_port_ids ?? []
    ).map(asSourcePortId)
    if (connectedSourcePortIds.length !== 2) continue
    if ((sourceTrace.connected_source_net_ids ?? []).length > 0) continue
    if (!connectedSourcePortIds.includes(sourcePortId)) continue

    const otherSourcePortId = connectedSourcePortIds.find(
      (portId) => portId !== sourcePortId,
    )
    if (!otherSourcePortId) continue

    if (
      !isDirectConnectionEndpointOutsideSchematicScope({
        db,
        sourcePortId,
        otherSourcePortId,
        sourcePortIdsInSchematicScope,
        schematicSheetId,
      })
    ) {
      continue
    }

    return otherSourcePortId
  }
}

export const resolveNetLabelForPortMissingTrace = ({
  group,
  sourcePortId,
  connectedSourcePortIdsForKey,
  sourcePortIdsInSchematicScope,
  schematicSheetId,
  connKey,
  sourceNet,
}: {
  group: Group<any>
  sourcePortId: SourcePortId
  connectedSourcePortIdsForKey: SourcePortId[]
  sourcePortIdsInSchematicScope: Set<SourcePortId>
  schematicSheetId?: SchematicSheetId
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
      schematicSheetId,
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
