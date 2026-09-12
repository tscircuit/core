import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

export const updateMissingSchematicSheetWarning = ({
  db,
  schematicDisabled,
}: {
  db: CircuitJsonUtilObjects
  schematicDisabled: boolean
}): void => {
  const existingWarning = db.schematic_missing_sheet_warning.list()[0]
  const hasSchematicComponents = db.schematic_component.list().length > 0
  const shouldWarn =
    !schematicDisabled &&
    hasSchematicComponents &&
    db.schematic_sheet.list().length === 0

  if (!shouldWarn) {
    if (existingWarning) {
      db.schematic_missing_sheet_warning.delete(
        existingWarning.schematic_missing_sheet_warning_id,
      )
    }
    return
  }

  if (existingWarning) return

  db.schematic_missing_sheet_warning.insert({
    warning_type: "schematic_missing_sheet_warning",
    message:
      "No <schematicsheet> was found. Add a <schematicsheet> to define the schematic drawing area.",
  })
}
