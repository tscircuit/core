import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * An unknown `schSheetName` emits a `schematic_sheet_missing_warning`.
 *
 * The board declares a single sheet named "Sheet A", but `U1` references
 * "Sheet B" (e.g. a typo). The chip's `schSheetName` cannot be resolved to any
 * sheet, so core emits a warning naming the sheet that could not be found
 * instead of silently ignoring it.
 */
test("unknown schSheetName emits a schematic_sheet_missing_warning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <chip name="U1" footprint="soic8" schSheetName="Sheet B" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({ name: "U1" })!
  const warnings = circuit.db.schematic_sheet_missing_warning.list()

  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    type: "schematic_sheet_missing_warning",
    sheet_name: "Sheet B",
    source_component_id: sourceComponent.source_component_id,
  })
  expect(warnings[0]!.message).toContain("Sheet B")
})
