import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol does not auto-match chip ports", async () => {
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

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'with chipRef ".Q1" requires explicit connections',
  )
})
