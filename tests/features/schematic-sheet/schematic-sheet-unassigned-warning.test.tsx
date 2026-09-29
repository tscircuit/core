import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an empty sheet does not hide the warning for unassigned components", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="RING" />
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings = circuit.db.schematic_missing_sheet_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain("1 schematic component(s)")
  expect(warnings[0].message).toContain("Empty schematic sheet(s): RING")
  expect(warnings[0].message).toContain("inside a <schematicsheet>")
  expect(
    circuit.db.schematic_component.list()[0].schematic_sheet_id,
  ).toBeUndefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
