import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol participates in a schematic section", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <schematicsection name="protection" displayName="Input Protection" />

      <chip
        name="D1"
        footprint="0402"
        noSchematicRepresentation
        pinLabels={{
          pin1: "A",
          pin2: "K",
        }}
      />
      <schematicsymbol
        name="A"
        chipRef=".D1"
        symbolName="diode_right"
        connections={{
          pin1: "D1.A",
          pin2: "D1.K",
        }}
        schSectionName="protection"
        schX={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schSectionName="protection"
        schX={-2}
      />

      <trace from=".R1 > .pin2" to=".D1 > .A" />
      <trace from=".D1 > .K" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.schematic_text.getWhere({ text: "Input Protection" }),
  ).toBeDefined()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
