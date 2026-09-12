import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import { updateMissingSchematicSheetWarning } from "lib/utils/schematic/update-missing-schematic-sheet-warning"

test("maintains one circuit-wide missing sheet warning as the circuit changes", () => {
  const db = cju([])
  const update = (schematicDisabled = false) =>
    updateMissingSchematicSheetWarning({ db, schematicDisabled })

  update()
  expect(db.schematic_missing_sheet_warning.list()).toEqual([])
  const component = db.schematic_component.insert({
    is_box_with_pins: false,
    center: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    source_component_id: "source_component_0",
  })
  update()
  const warning = db.schematic_missing_sheet_warning.list()[0]!
  expect(warning).toBeDefined()
  update()
  expect(db.schematic_missing_sheet_warning.list()).toEqual([warning])

  update(true)
  expect(db.schematic_missing_sheet_warning.list()).toEqual([])
  update()
  expect(db.schematic_missing_sheet_warning.list()).toHaveLength(1)
  db.schematic_component.delete(component.schematic_component_id)
  update()
  expect(db.schematic_missing_sheet_warning.list()).toEqual([])

  db.schematic_component.insert(component)
  update()
  const sheet = db.schematic_sheet.insert({
    name: "Main",
    sheet_index: 0,
  })
  update()
  expect(db.schematic_missing_sheet_warning.list()).toEqual([])
  db.schematic_sheet.delete(sheet.schematic_sheet_id)
  update()
  expect(db.schematic_missing_sheet_warning.list()).toHaveLength(1)
})
