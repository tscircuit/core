import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("gnd power label detection test", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="40mm">
      {/* Standard GND + VCC */}
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.GND" />

      {/* Analog ground AGND + VDD */}
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R2 > .pin1" to="net.VDD" />
      <trace from=".R2 > .pin2" to="net.AGND" />

      {/* Digital ground DGND + numeric voltage 3V3 */}
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={0}
      />
      <trace from=".R3 > .pin1" to="net.V3V3" />
      <trace from=".R3 > .pin2" to="net.DGND" />

      {/* VSS (ground) + VBUS */}
      <resistor
        name="R4"
        resistance="10k"
        footprint="0402"
        pcbX={15}
        pcbY={0}
      />
      <trace from=".R4 > .pin1" to="net.VBUS" />
      <trace from=".R4 > .pin2" to="net.VSS" />

      {/* Digital ground DGND + numeric voltage 3V3 */}
      <resistor
        name="R5"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={0}
      />
      <trace from=".R5 > .pin1" to="net.V3V" />
      <trace from=".R5 > .pin2" to="net.DGND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
