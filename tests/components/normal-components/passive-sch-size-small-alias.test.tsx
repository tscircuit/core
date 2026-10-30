import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("documented schSize small selects the sm compact resistor and capacitor symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R_SMALL"
        resistance="1k"
        schSize="small"
        schX={0}
        schY={3}
      />
      <capacitor
        name="C_SMALL"
        capacitance="1uF"
        schSize="small"
        schX={0}
        schY={0}
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.schematic_component.list().map(({ symbol_name }) => symbol_name),
  ).toEqual(["boxresistor_sm_right", "capacitor_sm_right"])
})
