import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

export const updateMissingSchematicSheetWarning = ({
  db,
  schematicDisabled,
}: {
  db: CircuitJsonUtilObjects
  schematicDisabled: boolean
}): void => {
  const existingWarning = db.schematic_missing_sheet_warning.list()[0]
  const schematicComponents = db.schematic_component.list()
  const schematicSheets = db.schematic_sheet.list()
  const sheetIds = new Set(
    schematicSheets.map((sheet) => sheet.schematic_sheet_id),
  )
  const unassignedComponents = schematicComponents.filter(
    (component) =>
      !component.schematic_sheet_id ||
      !sheetIds.has(component.schematic_sheet_id),
  )
  const populatedSheetIds = new Set(
    schematicComponents.map((component) => component.schematic_sheet_id),
  )
  const emptySheets = schematicSheets.filter(
    (sheet) => !populatedSheetIds.has(sheet.schematic_sheet_id),
  )
  const shouldWarn =
    !schematicDisabled &&
    schematicComponents.length > 0 &&
    (unassignedComponents.length > 0 || emptySheets.length > 0)

  if (!shouldWarn) {
    if (existingWarning) {
      db.schematic_missing_sheet_warning.delete(
        existingWarning.schematic_missing_sheet_warning_id,
      )
    }
    return
  }

  const message =
    schematicSheets.length === 0
      ? "No <schematicsheet> was found. Add a <schematicsheet> to define the schematic drawing area."
      : [
          unassignedComponents.length > 0
            ? `${unassignedComponents.length} schematic component(s) have no matching <schematicsheet>. Place them inside a <schematicsheet> so they appear in sheet previews.`
            : "",
          emptySheets.length > 0
            ? `Empty schematic sheet(s): ${emptySheets.map((sheet) => sheet.name).join(", ")}. A self-closing <schematicsheet /> does not assign sibling components to the sheet.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")

  if (existingWarning) {
    db.schematic_missing_sheet_warning.update(
      existingWarning.schematic_missing_sheet_warning_id,
      { message },
    )
    return
  }

  db.schematic_missing_sheet_warning.insert({
    warning_type: "schematic_missing_sheet_warning",
    message,
  })
}
