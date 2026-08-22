import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic sheet links schematic component with direct schSheetName", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        displayName="Main Sheet"
        sheetIndex={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={0}
        schY={0}
        schSheetName="Main Sheet"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheet = circuit.db.schematic_sheet.getWhere({
    name: "Main Sheet",
  })
  const schematicSheetId = schematicSheet?.schematic_sheet_id

  const sourceComponent = circuit.db.source_component.getWhere({ name: "R1" })
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent?.source_component_id,
  })

  expect(schematicComponent).toMatchObject({
    schematic_sheet_id: schematicSheetId,
  })

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
