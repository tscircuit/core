import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Group with match-adapt layout - simple two component circuit", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group matchAdapt name="simple_circuit">
        <resistor name="R1" resistance="1k" />
        <capacitor name="C1" capacitance="10uF" />
        <trace from=".R1 > .1" to=".C1 > .1" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
