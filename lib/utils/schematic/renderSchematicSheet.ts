import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Point, SchematicSheet } from "circuit-json"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { insertSchematicElementOutsideSheetWarnings } from "./insertSchematicElementOutsideSheetWarnings"

export type SchematicSheetWithRenderMetadata = SchematicSheet & {
  display_name?: string
  center?: Point
}

export type SchematicSheetInsert = Omit<
  SchematicSheetWithRenderMetadata,
  "type" | "schematic_sheet_id"
>

export const assignSchematicElementsToSheet = ({
  db,
  schematicSheetId,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: string
}): void => {
  for (const element of db.schematic_arc.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_arc.update(element.schematic_arc_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_circle.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_circle.update(element.schematic_circle_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_component.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_component.update(element.schematic_component_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_group.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_group.update(element.schematic_group_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_line.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_line.update(element.schematic_line_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_net_label.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_net_label.update(element.schematic_net_label_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_path.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_path.update(element.schematic_path_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_port.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_port.update(element.schematic_port_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_rect.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_rect.update(element.schematic_rect_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_table.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_table.update(element.schematic_table_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_table_cell.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_table_cell.update(element.schematic_table_cell_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_text.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_text.update(element.schematic_text_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_trace.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_trace.update(element.schematic_trace_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
  for (const element of db.schematic_voltage_probe.list()) {
    if (element.schematic_sheet_id) continue
    db.schematic_voltage_probe.update(element.schematic_voltage_probe_id, {
      schematic_sheet_id: schematicSheetId,
    })
  }
}

export const renderSchematicSheet = ({
  db,
  schematicSheetId,
  schematicSheetName,
}: {
  db: CircuitJsonUtilObjects
  schematicSheetId: string
  schematicSheetName: string
}): void => {
  const schematicElements = [
    ...db.schematic_component.list(),
    ...db.schematic_port.list(),
    ...db.schematic_text.list(),
    ...db.schematic_line.list(),
    ...db.schematic_rect.list(),
    ...db.schematic_circle.list(),
    ...db.schematic_arc.list(),
    ...db.schematic_path.list(),
  ].filter((element) => element.schematic_sheet_id === schematicSheetId)

  let schematicSheetCenter = { x: 0, y: 0 }
  if (schematicElements.length > 0) {
    const bounds = getBoundsForSchematic(schematicElements)
    if (
      Number.isFinite(bounds.minX) &&
      Number.isFinite(bounds.maxX) &&
      Number.isFinite(bounds.minY) &&
      Number.isFinite(bounds.maxY)
    ) {
      schematicSheetCenter = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      }

      const sheetUpdate: Partial<SchematicSheetWithRenderMetadata> = {
        center: schematicSheetCenter,
      }
      db.schematic_sheet.update(schematicSheetId, sheetUpdate)
    }
  }

  insertSchematicElementOutsideSheetWarnings({
    db,
    schematicSheetId,
    schematicSheetName,
    schematicSheetCenter,
  })
}
