import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip schDisplayValue populates the schematic symbol value", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="R1"
        symbolName="resistor_right"
        schDisplayValue="10k imported value"
        footprint="0402"
        pinLabels={{ pin1: "1", pin2: "2" }}
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit
      .getCircuitJson()
      .find((element) => element.type === "schematic_component"),
  ).toMatchObject({ symbol_display_value: "10k imported value" })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
