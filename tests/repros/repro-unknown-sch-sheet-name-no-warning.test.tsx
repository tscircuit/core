import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * REPRO (test.failing): an unknown `schSheetName` should emit a warning.
 *
 * The board declares a single sheet named "Sheet A", but `U1` references
 * "Sheet B" (e.g. a typo). `_resolveSchematicSheetId` silently fails to find a
 * matching sheet and falls back to the parent's sheet, so the chip renders with
 * no feedback that its `schSheetName` was ignored.
 *
 * When unknown-sheet warnings are implemented, a warning referencing "Sheet B"
 * should be present and this test should pass; flip it back to `test` at that
 * point.
 */
test.failing("unknown schSheetName emits a warning", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <chip name="U1" footprint="soic8" schSheetName="Sheet B" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // A warning should tell the user that "Sheet B" could not be found.
  const circuitJson = circuit.getCircuitJson()
  const warnings = circuitJson.filter((elm: AnyCircuitElement) =>
    elm.type.endsWith("_warning"),
  )
  const mentionsMissingSheet = warnings.some((w) =>
    JSON.stringify(w).includes("Sheet B"),
  )
  expect(mentionsMissingSheet).toBe(true)
})
