import type { SchematicSheet as SchematicSheetElement } from "circuit-json"
import { SchematicSheet } from "lib/components/primitive-components/SchematicSheet"
import type { InflatorContext } from "../InflatorFn"

export function inflateSchematicSheets(inflatorContext: InflatorContext): void {
  for (const schematicSheet of inflatorContext.injectionDb.schematic_sheet.list()) {
    inflatorContext.subcircuit.add(
      new SchematicSheet({
        name: schematicSheet.name,
        displayName:
          "display_name" in schematicSheet &&
          typeof schematicSheet.display_name === "string"
            ? schematicSheet.display_name
            : schematicSheet.name,
        sheetIndex: schematicSheet.sheet_index,
        sheetSize: getSheetSize(schematicSheet),
        sheetWidth: schematicSheet.sheet_width,
        sheetHeight: schematicSheet.sheet_height,
      }),
    )
  }
}

function getSheetSize(schematicSheet: SchematicSheetElement): "A4" | "ANSI_B" {
  return schematicSheet.sheet_size?.toUpperCase() === "ANSI_B" ? "ANSI_B" : "A4"
}
