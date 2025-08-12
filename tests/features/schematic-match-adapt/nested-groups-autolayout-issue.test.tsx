import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested-groups-autolayout-issue", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <group matchAdapt>
        <resistor name="R2" resistance="2.2k" />
      </group>
      <group>
        <resistor name="R3" resistance="10k" />
      </group>
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
