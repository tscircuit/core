import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol ignores chipRef without connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="Q1"
        footprint="sot23"
        noSchematicRepresentation
        pinLabels={{ pin1: "G", pin2: "S", pin3: "D" }}
      />
      <schematicsymbol
        name="A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_property_ignored_warning.list()).toEqual([
    expect.objectContaining({
      property_name: "chipRef",
      message: expect.stringContaining(
        'has chipRef ".Q1" without connections. chipRef will be ignored.',
      ),
    }),
  ])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
