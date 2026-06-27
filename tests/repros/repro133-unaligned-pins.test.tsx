import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const DebugCircuit = () => (
  <board>
    <switch name="SW2" schRotation="-90" />
    <resistor name="R29" resistance="1k" schOrientation="vertical" />

    <switch name="SW1" schRotation="-90" />
    <resistor name="R9" resistance="1k" schOrientation="vertical" />

    <led name="ACT_LED" schRotation="-90" />
    <resistor name="R10" resistance="1k" schOrientation="vertical" />

    <led name="AUX_LED" schRotation="-90" />
    <resistor name="R28" resistance="1k" schOrientation="vertical" />

    <trace from="R29.pin2" to="net.GND" />
    <trace from="R9.pin2" to="net.GND" />
    <trace from="R10.pin2" to="net.GND" />
    <trace from="R28.pin2" to="net.GND" />

    <trace from="SW2.pin2" to="R29.pin1" />
    <trace from="SW1.pin2" to="R9.pin1" />
    <trace from="ACT_LED.pin2" to="R10.pin1" />
    <trace from="AUX_LED.pin2" to="R28.pin1" />
  </board>
)

test("repro133: unaligned pins", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<DebugCircuit />)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
