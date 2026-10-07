import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit schematic sheet center preserves its world position", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="Offset Sheet" sheetIndex={0} schX={8} schY={-5}>
        <schematictext text="WORLD ORIGIN" schX={0} schY={0} fontSize={0.5} />
        <schematictext
          text="EXPLICIT SHEET CENTER"
          schX={8}
          schY={-5}
          fontSize={0.5}
        />
        <schematicrect schX={8} schY={-5} width={2} height={2} />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.schematic_sheet.getWhere({ name: "Offset Sheet" }),
  ).toMatchObject({ center: { x: 8, y: -5 } })
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
