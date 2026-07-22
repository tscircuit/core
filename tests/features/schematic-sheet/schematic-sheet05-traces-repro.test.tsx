import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: sheet-local traces disappear from multi-sheet rendering", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="power" displayName="Power Sheet" sheetIndex={0}>
        <resistor name="R1" resistance="1k" footprint="0402" schX={-2} />
        <resistor name="R2" resistance="2k" footprint="0402" schX={2} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </schematicsheet>
      <schematicsheet name="control" displayName="Control Sheet" sheetIndex={1}>
        <resistor name="R3" resistance="3k" footprint="0402" schX={-2} />
        <resistor name="R4" resistance="4k" footprint="0402" schX={2} />
        <trace from=".R3 > .pin2" to=".R4 > .pin1" />
      </schematicsheet>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_trace.list()).toHaveLength(2)

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
