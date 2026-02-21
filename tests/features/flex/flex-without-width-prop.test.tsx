import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("flex without width prop should take the width of the parent", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <group subcircuit pcbFlex height="20mm" justifyContent="space-between">
        <capacitor name="C1" capacitance="10uF" footprint="0603" />
        <capacitor name="C2" capacitance="10uF" footprint="0603" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
