import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

const MISSING_SCHEMATIC_SHEET_ISSUE_TYPE = "missing_schematic_sheet"

export const updateMissingSchematicSheetWarning = ({
  db,
  schematicDisabled,
}: {
  db: CircuitJsonUtilObjects
  schematicDisabled: boolean
}): void => {
  const existingWarning = db.schematic_component_styling_warning
    .list()
    .find(
      (warning) =>
        warning.styling_issue_type === MISSING_SCHEMATIC_SHEET_ISSUE_TYPE,
    )
  const firstSchematicComponent = db.schematic_component.list()[0]
  const shouldWarn =
    !schematicDisabled &&
    Boolean(firstSchematicComponent) &&
    db.schematic_sheet.list().length === 0

  if (!shouldWarn) {
    if (existingWarning) {
      db.schematic_component_styling_warning.delete(
        existingWarning.schematic_component_styling_warning_id,
      )
    }
    return
  }

  if (existingWarning || !firstSchematicComponent) return

  db.schematic_component_styling_warning.insert({
    warning_type: "schematic_component_styling_warning",
    message:
      "No <schematicsheet> was found. Add a <schematicsheet> to define the schematic drawing area.",
    schematic_component_id: firstSchematicComponent.schematic_component_id,
    source_component_id: firstSchematicComponent.source_component_id,
    subcircuit_id: firstSchematicComponent.subcircuit_id,
    styling_issue_type: MISSING_SCHEMATIC_SHEET_ISSUE_TYPE,
  })
}
