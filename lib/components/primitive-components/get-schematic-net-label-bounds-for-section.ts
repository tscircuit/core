import {
  type CircuitJsonUtilObjects,
  getSchematicElementBounds,
} from "@tscircuit/circuit-json-util"
import type { Bounds } from "@tscircuit/math-utils"
import type {
  SchematicComponent,
  SchematicNetLabel,
  SchematicPort,
  SchematicSheet,
  SourcePort,
} from "circuit-json"

type SchematicComponentId = SchematicComponent["schematic_component_id"]
type SchematicSheetId = SchematicSheet["schematic_sheet_id"]
type SourcePortId = SourcePort["source_port_id"]

const getConnectedSourcePortIds = ({
  db,
  schematicNetLabel,
  sourcePorts,
}: {
  db: CircuitJsonUtilObjects
  schematicNetLabel: SchematicNetLabel
  sourcePorts: SourcePort[]
}): Set<SourcePortId> => {
  if (schematicNetLabel.source_trace_id) {
    const sourceTrace = db.source_trace.get(schematicNetLabel.source_trace_id)
    return new Set(sourceTrace?.connected_source_port_ids ?? [])
  }
  if (!schematicNetLabel.source_net_id) return new Set()

  const sourceNet = db.source_net.get(schematicNetLabel.source_net_id)
  const connectivityMapKey =
    sourceNet?.subcircuit_connectivity_map_key ??
    schematicNetLabel.source_net_id
  return new Set(
    sourcePorts
      .filter(
        (sourcePort) =>
          sourcePort.subcircuit_connectivity_map_key === connectivityMapKey,
      )
      .map((sourcePort) => sourcePort.source_port_id),
  )
}

const getNearestConnectedSchematicPort = ({
  schematicNetLabel,
  schematicPorts,
  connectedSourcePortIds,
}: {
  schematicNetLabel: SchematicNetLabel
  schematicPorts: SchematicPort[]
  connectedSourcePortIds: Set<SourcePortId>
}): SchematicPort | undefined => {
  if (!schematicNetLabel.anchor_position) return undefined

  let nearestSchematicPort: SchematicPort | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const schematicPort of schematicPorts) {
    if (!schematicPort.source_port_id) continue
    if (!connectedSourcePortIds.has(schematicPort.source_port_id)) continue

    const distance = Math.hypot(
      schematicPort.center.x - schematicNetLabel.anchor_position.x,
      schematicPort.center.y - schematicNetLabel.anchor_position.y,
    )
    if (distance >= nearestDistance) continue
    nearestSchematicPort = schematicPort
    nearestDistance = distance
  }
  return nearestSchematicPort
}

export const getSchematicNetLabelBoundsForSection = ({
  db,
  schematicSheetId,
  memberSchematicComponentIds,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: SchematicSheetId | undefined
  memberSchematicComponentIds: Set<SchematicComponentId>
}): Bounds[] => {
  const sourcePorts = db.source_port.list()
  const schematicPorts = db.schematic_port
    .list()
    .filter((port) => port.schematic_sheet_id === schematicSheetId)
  const memberSchematicPortIds = new Set(
    schematicPorts
      .filter(
        (port) =>
          port.schematic_component_id != null &&
          memberSchematicComponentIds.has(port.schematic_component_id),
      )
      .map((port) => port.schematic_port_id),
  )
  const bounds: Bounds[] = []

  for (const schematicNetLabel of db.schematic_net_label.list()) {
    if (schematicNetLabel.schematic_sheet_id !== schematicSheetId) continue

    const connectedSourcePortIds = getConnectedSourcePortIds({
      db,
      schematicNetLabel,
      sourcePorts,
    })
    const nearestSchematicPort = getNearestConnectedSchematicPort({
      schematicNetLabel,
      schematicPorts,
      connectedSourcePortIds,
    })
    if (!nearestSchematicPort) continue
    if (!memberSchematicPortIds.has(nearestSchematicPort.schematic_port_id)) {
      continue
    }

    const schematicNetLabelBounds = getSchematicElementBounds(schematicNetLabel)
    if (schematicNetLabelBounds) bounds.push(schematicNetLabelBounds)
  }

  return bounds
}
