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

  const keepouts = circuit.selectAll("keepout")
  expect(keepouts.length).toBe(1)
  const k1 = keepouts[0]

  expect(k1.getPcbSize()).toEqual({ width: 10, height: 10 })
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
