import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ANSI B schematic sheets use the larger drawing area", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        displayName="Main Sheet"
        sheetSize="ANSI_B"
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schX={-20}
          schY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          schX={20}
          schY={0}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_sheet.list()[0]).toMatchObject({
    sheet_size: "ansi_b",
    sheet_width: 431.8,
    sheet_height: 279.4,
  })
  expect(
    circuit.db.schematic_element_outside_sheet_warning.list(),
  ).toHaveLength(0)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
