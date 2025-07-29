import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with nested group flex", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="100mm" routingDisabled>
      <group
        flex
        subcircuit
        width="20mm"
        height="20mm"
        justifyContent="space-between"
      >
        <capacitor name="C1" capacitance="10uF" footprint="0603" />
        <capacitor name="C2" capacitance="10uF" footprint="0603" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
