import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core emits a default schematic sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" schX={99} />
      <capacitor name="C1" capacitance="1uF" footprint="0402" schX={101} />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicSheets = circuit.db.schematic_sheet.list()
  expect(schematicSheets).toHaveLength(1)
  expect(schematicSheets[0]).toMatchObject({
    name: "Default Sheet",
    display_name: "Default Sheet",
    sheet_index: 0,
    center: {
      x: 100,
      y: 0,
    },
  })

  const defaultSchematicSheetId = schematicSheets[0].schematic_sheet_id
  const defaultSheetElements = [
    ...circuit.db.schematic_component.list(),
    ...circuit.db.schematic_port.list(),
    ...circuit.db.schematic_trace.list(),
  ]

  expect(defaultSheetElements.length).toBeGreaterThan(0)
  expect(
    defaultSheetElements.every(
      (element) => element.schematic_sheet_id === defaultSchematicSheetId,
    ),
  ).toBe(true)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
