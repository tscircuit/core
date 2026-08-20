import {
  type CircuitJsonUtilObjects,
  transformSchematicElements,
} from "@tscircuit/circuit-json-util"
import type { SchematicSheet } from "circuit-json"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { applyToPoint, translate } from "transformation-matrix"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

export const centerSchematicSheetContents = ({
  db,
  schematicSheetId,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: SchematicSheetId
}): void => {
  const schematicSheetFilter = { schematic_sheet_id: schematicSheetId }
  const schematicElements = [
    ...db.schematic_component.list(schematicSheetFilter),
    ...db.schematic_port.list(schematicSheetFilter),
    ...db.schematic_text.list(schematicSheetFilter),
    ...db.schematic_line.list(schematicSheetFilter),
    ...db.schematic_rect.list(schematicSheetFilter),
    ...db.schematic_circle.list(schematicSheetFilter),
    ...db.schematic_arc.list(schematicSheetFilter),
    ...db.schematic_path.list(schematicSheetFilter),
  ]

  if (schematicElements.length === 0) return

  const bounds = getBoundsForSchematic(schematicElements)
  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY)
  ) {
    return
  }

  const schematicToOriginTransform = translate(
    -(bounds.minX + bounds.maxX) / 2,
    -(bounds.minY + bounds.maxY) / 2,
  )

  transformSchematicElements(
    [
      ...schematicElements,
      ...db.schematic_net_label.list(schematicSheetFilter),
      ...db.schematic_trace.list(schematicSheetFilter),
    ],
    schematicToOriginTransform,
  )

  for (const element of [
    ...db.schematic_rect.list(schematicSheetFilter),
    ...db.schematic_circle.list(schematicSheetFilter),
    ...db.schematic_arc.list(schematicSheetFilter),
  ]) {
    element.center = applyToPoint(schematicToOriginTransform, element.center)
  }

  for (const path of db.schematic_path.list(schematicSheetFilter)) {
    path.points = path.points.map((point) =>
      applyToPoint(schematicToOriginTransform, point),
    )
  }

  for (const netLabel of db.schematic_net_label.list(schematicSheetFilter)) {
    netLabel.center = applyToPoint(schematicToOriginTransform, netLabel.center)
    if (netLabel.anchor_position) {
      netLabel.anchor_position = applyToPoint(
        schematicToOriginTransform,
        netLabel.anchor_position,
      )
    }
  }
}
