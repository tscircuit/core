import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named traces crossing schematic sheets use inline label stubs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} routingDisabled>
      <schematicsheet name="Sheet A" displayName="Sheet A" sheetIndex={0} />
      <schematicsheet name="Sheet B" displayName="Sheet B" sheetIndex={1} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schSheetName="Sheet A"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schSheetName="Sheet B"
      />
      <trace name="CROSS_SHEET_SIGNAL" from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "CROSS_SHEET_SIGNAL",
  })!
  expect(
    circuit.db.schematic_text
      .list()
      .filter(
        (text) =>
          text.text === "CROSS_SHEET_SIGNAL" &&
          text.source_trace_id === sourceTrace.source_trace_id,
      ),
  ).toHaveLength(2)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "CROSS_SHEET_SIGNAL"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
