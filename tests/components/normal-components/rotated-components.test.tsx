import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated resistor/diode/inductor/led/capacitor schematic", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        schY={0}
        schX={0}
        resistance="10k"
        schRotation="90deg"
      />
      <led name="L1" schY={0} schX={2} schRotation="90deg" />
      <inductor
        name="I1"
        schY={0}
        schX={4}
        inductance="10k"
        schRotation="90deg"
      />
      <capacitor
        name="C1"
        schY={0}
        schX={6}
        capacitance="10k"
        schRotation="90deg"
      />
      <diode name="D1" schY={0} schX={8} schRotation="90deg" />

      <diode name="D2" schY={0} schX={10} />

      <trace from=".D1 > .pin2" to="net.GND" />
      <trace from=".D1 > .pin1" to="net.VCC" />
      <trace from=".D2 > .pin2" to="net.GND" />
      <trace from=".D2 > .pin1" to="net.VCC" />
    </board>,
  )

  circuit.render()

  const symbolNames = circuit.db.schematic_component
    .list()
    .map((elm) => elm.symbol_name)

  expect(symbolNames.includes("capacitor_up")).toBeTruthy()
  expect(symbolNames.includes("inductor_up")).toBeTruthy()
  expect(symbolNames.includes("led_up")).toBeTruthy()
  expect(symbolNames.includes("boxresistor_up")).toBeTruthy()
  expect(symbolNames.includes("diode_up")).toBeTruthy()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
