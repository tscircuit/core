import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a populated sheet still warns about components outside it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Main">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </schematicsheet>
      <resistor name="R2" resistance="2k" footprint="0402" pcbX={3} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings = circuit.db.schematic_missing_sheet_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toContain("1 schematic component(s)")
  expect(warnings[0].message).not.toContain("Empty schematic sheet")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
