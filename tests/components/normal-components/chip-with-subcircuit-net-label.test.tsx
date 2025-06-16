import { it, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it.skip("subcircuit having a net label GND makes the circuit fail to use GND in other part of circuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group subcircuit>
        <net name="GND" />
      </group>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
      <trace from=".U1 > .8" to="net.GND" />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.dir)
})
