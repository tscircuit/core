import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group-match-adapt2", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group matchAdapt name="simple_circuit">
        <resistor name="R1" resistance="1k" />
        <capacitor name="C1" capacitance="10uF" />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
