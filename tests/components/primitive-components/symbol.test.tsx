import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("primitive symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        symbol={"avalanche_diode"}
      />
    </board>,
  )

  circuit.render()

  const schComponents = circuit.db.schematic_component.list()[0]
  expect(schComponents.symbol_name).toMatchInlineSnapshot(
    `"avalanche_diode_right"`,
  )

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
