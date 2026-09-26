import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit sheet indices reserve later explicit indices and fill gaps", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Automatic first" />
      <group name="Nested">
        <schematicsheet name="Explicit zero" sheetIndex={0} />
        <schematicsheet name="Explicit two" sheetIndex={2} />
      </group>
      <schematicsheet name="Automatic second" />
      <schematicsheet name="Explicit seven" sheetIndex={7} />
      <schematicsheet name="Automatic third" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    Object.fromEntries(
      circuit.db.schematic_sheet
        .list()
        .map((sheet) => [sheet.name, sheet.sheet_index]),
    ),
  ).toEqual({
    "Automatic first": 1,
    "Explicit zero": 0,
    "Explicit two": 2,
    "Automatic second": 3,
    "Explicit seven": 7,
    "Automatic third": 4,
  })
})
