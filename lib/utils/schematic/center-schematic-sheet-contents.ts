import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SchematicSheet } from "circuit-json"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"

type SchematicSheetId = SchematicSheet["schematic_sheet_id"]

export const centerSchematicSheetContents = ({
  db,
  schematicSheetId,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: SchematicSheetId
}): void => {
  const schematicElements = [
    ...db.schematic_component.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_port.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_text.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_line.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_rect.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_circle.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_arc.list({ schematic_sheet_id: schematicSheetId }),
    ...db.schematic_path.list({ schematic_sheet_id: schematicSheetId }),
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

  const deltaX = -(bounds.minX + bounds.maxX) / 2
  const deltaY = -(bounds.minY + bounds.maxY) / 2

  for (const component of db.schematic_component.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    component.center.x += deltaX
    component.center.y += deltaY
  }

  for (const port of db.schematic_port.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    port.center.x += deltaX
    port.center.y += deltaY
  }

  for (const text of db.schematic_text.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    text.position.x += deltaX
    text.position.y += deltaY
  }

  for (const line of db.schematic_line.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    line.x1 += deltaX
    line.y1 += deltaY
    line.x2 += deltaX
    line.y2 += deltaY
  }

  for (const rect of db.schematic_rect.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    rect.center.x += deltaX
    rect.center.y += deltaY
  }

  for (const circle of db.schematic_circle.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    circle.center.x += deltaX
    circle.center.y += deltaY
  }

  for (const arc of db.schematic_arc.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    arc.center.x += deltaX
    arc.center.y += deltaY
  }

  for (const path of db.schematic_path.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    for (const point of path.points) {
      point.x += deltaX
      point.y += deltaY
    }
  }

  for (const netLabel of db.schematic_net_label.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    netLabel.center.x += deltaX
    netLabel.center.y += deltaY
    if (netLabel.anchor_position) {
      netLabel.anchor_position.x += deltaX
      netLabel.anchor_position.y += deltaY
    }
  }

  for (const trace of db.schematic_trace.list({
    schematic_sheet_id: schematicSheetId,
  })) {
    for (const edge of trace.edges) {
      edge.from.x += deltaX
      edge.from.y += deltaY
      edge.to.x += deltaX
      edge.to.y += deltaY
    }
    for (const junction of trace.junctions) {
      junction.x += deltaX
      junction.y += deltaY
    }
  }
}
