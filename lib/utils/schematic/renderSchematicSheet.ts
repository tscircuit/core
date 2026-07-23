import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { insertSchematicElementOutsideSheetWarnings } from "./insertSchematicElementOutsideSheetWarnings"

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
  ].filter(
    (element) => (element as any).schematic_sheet_id === schematicSheetId,
  )

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

      db.schematic_sheet.update(schematicSheetId, {
        center: schematicSheetCenter,
      } as any)
    }
  }

  insertSchematicElementOutsideSheetWarnings({
    db,
    schematicSheetId,
    schematicSheetName,
    schematicSheetCenter,
  })
}
