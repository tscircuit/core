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
  SchematicText,
  SourcePort,
  SourceNet,
  SourceTrace,
} from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

type SchematicComponentId = SchematicComponent["schematic_component_id"]
type SchematicSheetId = SchematicSheet["schematic_sheet_id"]
type SourcePortId = SourcePort["source_port_id"]
type SourceNetId = SourceNet["source_net_id"]
type SourceTraceId = SourceTrace["source_trace_id"]

/**
 * Returns an axis-aligned box in schematic-world millimetres (+X right, +Y
 * top) for inline net-label text whose local origin is its anchor position.
 */
const getInlineSchematicTextBounds = (schematicText: SchematicText): Bounds => {
  const width = getSchematicNetLabelTextWidth({
    text: schematicText.text,
    font_size: schematicText.font_size,
  })
  const height = schematicText.font_size
  let minLocalX = -width / 2
  let maxLocalX = width / 2
  if (schematicText.anchor === "left") {
    minLocalX = 0
    maxLocalX = width
  }
  if (schematicText.anchor === "right") {
    minLocalX = -width
    maxLocalX = 0
  }
  const ccwRotationDegrees = schematicText.rotation
  const schematicTextLocalToWorldTransform = compose(
    translate(schematicText.position.x, schematicText.position.y),
    rotateDEG(ccwRotationDegrees),
  )
  const schematicWorldCorners = [
    { x: minLocalX, y: -height / 2 },
    { x: maxLocalX, y: -height / 2 },
    { x: maxLocalX, y: height / 2 },
    { x: minLocalX, y: height / 2 },
  ].map((corner) => applyToPoint(schematicTextLocalToWorldTransform, corner))
  const schematicWorldXs = schematicWorldCorners.map((corner) => corner.x)
  const schematicWorldYs = schematicWorldCorners.map((corner) => corner.y)

  return {
    minX: Math.min(...schematicWorldXs),
    maxX: Math.max(...schematicWorldXs),
    minY: Math.min(...schematicWorldYs),
    maxY: Math.max(...schematicWorldYs),
  }
}

const getConnectedSourcePortIds = ({
  db,
  sourceTraceId,
  sourceNetId,
  sourcePorts,
}: {
  db: CircuitJsonUtilObjects
  sourceTraceId: SourceTraceId | undefined
  sourceNetId: SourceNetId | undefined
  sourcePorts: SourcePort[]
}): Set<SourcePortId> => {
  if (sourceTraceId) {
    const sourceTrace = db.source_trace.get(sourceTraceId)
    return new Set(sourceTrace?.connected_source_port_ids ?? [])
  }
  if (!sourceNetId) return new Set()

  const sourceNet = db.source_net.get(sourceNetId)
  const connectivityMapKey =
    sourceNet?.subcircuit_connectivity_map_key ?? sourceNetId
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
  labelPosition,
  schematicPorts,
  connectedSourcePortIds,
}: {
  labelPosition: { x: number; y: number }
  schematicPorts: SchematicPort[]
  connectedSourcePortIds: Set<SourcePortId>
}): SchematicPort | undefined => {
  let nearestSchematicPort: SchematicPort | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const schematicPort of schematicPorts) {
    if (!schematicPort.source_port_id) continue
    if (!connectedSourcePortIds.has(schematicPort.source_port_id)) continue

    const distance = Math.hypot(
      schematicPort.center.x - labelPosition.x,
      schematicPort.center.y - labelPosition.y,
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
  const schematicLabels: Array<{
    label: SchematicNetLabel | SchematicText
    position: { x: number; y: number }
    sourceTraceId: SourceTraceId | undefined
    sourceNetId: SourceNetId | undefined
  }> = []

  for (const schematicNetLabel of db.schematic_net_label.list()) {
    if (schematicNetLabel.schematic_sheet_id !== schematicSheetId) continue
    if (!schematicNetLabel.anchor_position) continue

    schematicLabels.push({
      label: schematicNetLabel,
      position: schematicNetLabel.anchor_position,
      sourceTraceId: schematicNetLabel.source_trace_id,
      sourceNetId: schematicNetLabel.source_net_id,
    })
  }
  for (const schematicText of db.schematic_text.list()) {
    if (schematicText.schematic_sheet_id !== schematicSheetId) continue
    if (!schematicText.source_trace_id) continue

    schematicLabels.push({
      label: schematicText,
      position: schematicText.position,
      sourceTraceId: schematicText.source_trace_id,
      sourceNetId: undefined,
    })
  }

  for (const schematicLabel of schematicLabels) {
    const connectedSourcePortIds = getConnectedSourcePortIds({
      db,
      sourceTraceId: schematicLabel.sourceTraceId,
      sourceNetId: schematicLabel.sourceNetId,
      sourcePorts,
    })
    const nearestSchematicPort = getNearestConnectedSchematicPort({
      labelPosition: schematicLabel.position,
      schematicPorts,
      connectedSourcePortIds,
    })
    if (!nearestSchematicPort) continue
    if (!memberSchematicPortIds.has(nearestSchematicPort.schematic_port_id)) {
      continue
    }

    let schematicLabelBounds: Bounds | null
    if (schematicLabel.label.type === "schematic_text") {
      schematicLabelBounds = getInlineSchematicTextBounds(schematicLabel.label)
    } else {
      schematicLabelBounds = getSchematicElementBounds(schematicLabel.label)
    }
    if (schematicLabelBounds) bounds.push(schematicLabelBounds)
  }

  return bounds
}
