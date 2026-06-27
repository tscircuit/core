import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsheet creates a schematic_sheet and the subcircuit inside it", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematicsheet name="sheet1" displayName="sheet1">
        <subcircuit>
          <resistor name="R1" resistance="1k" />
          <capacitor name="C1" capacitance="1uF" />
          <trace from=".R1 > .pin1" to=".C1 > .pin1" />
        </subcircuit>
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_sheet.list()).toEqual([
    {
      type: "schematic_sheet",
      schematic_sheet_id: "schematic_sheet_0",
      name: "sheet1",
      subcircuit_id: "subcircuit_source_group_0",
    },
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
