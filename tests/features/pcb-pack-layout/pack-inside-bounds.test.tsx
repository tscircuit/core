import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pack inside group width and height specified", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group subcircuit pack width="5mm" height="5mm" pcbX={2.5} pcbY={-2.5}>
        <resistor name="R2" resistance="1k" footprint="0402" />
        <capacitor name="C2" capacitance="100nF" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
