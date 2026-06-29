import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * An unknown `schSheetName` emits a `source_property_ignored_warning`.
 *
 * The board declares a single sheet named "Sheet A", but `U1` references
 * "Sheet B" (e.g. a typo). The chip's `schSheetName` cannot be resolved to any
 * sheet, so core warns that the `schSheetName` property was ignored (naming the
 * sheet that could not be found) instead of silently dropping it.
 */
test("unknown schSheetName emits a source_property_ignored_warning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <chip name="U1" footprint="soic8" schSheetName="Sheet B" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component.getWhere({ name: "U1" })!
  const warning = circuit.db.source_property_ignored_warning.getWhere({
    property_name: "schSheetName",
  })

  expect(warning).toBeDefined()
  expect(warning).toMatchObject({
    property_name: "schSheetName",
    source_component_id: sourceComponent.source_component_id,
  })
  expect(warning!.message).toContain("Sheet B")
})
