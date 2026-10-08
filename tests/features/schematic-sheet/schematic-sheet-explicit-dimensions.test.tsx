import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit schematic sheet dimensions keep the origin fixed", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet
        name="Main Sheet"
        displayName="Main Sheet"
        sheetWidth="120mm"
        sheetHeight="80mm"
      >
        <schematictext
          text="FIXED ORIGIN"
          schX={-3.5}
          schY={3}
          fontSize={0.4}
        />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_sheet.list()[0]).toMatchObject({
    sheet_size: "a4",
    sheet_width: 120,
    sheet_height: 80,
    center: { x: 0, y: 0 },
  })
  expect(
    circuit.db.schematic_element_outside_sheet_warning.list(),
  ).toHaveLength(0)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
