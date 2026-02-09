import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Keepout getPcbSize", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="50mm">
      <group name="test" subcircuit>
        <keepout pcbX={0} pcbY={0} shape="rect" width="10mm" height="10mm" />
      </group>
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
