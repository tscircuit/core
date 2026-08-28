import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named traces crossing schematic sections use inline label stubs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} routingDisabled>
      <schematicsection name="left" displayName="Left" />
      <schematicsection name="right" displayName="Right" />
      <subcircuit name="MODULE">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          schSectionName="left"
        />
      </subcircuit>
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schSectionName="right"
      />
      <trace
        schDisplayLabel="SECTION_SIG"
        from=".MODULE .R1 > .pin2"
        to=".R2 > .pin1"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.schematic_text
      .list()
      .filter((text) => text.text === "SECTION_SIG" && text.source_trace_id),
  ).toHaveLength(2)
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "SECTION_SIG"),
  ).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
