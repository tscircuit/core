import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example31 simple 3d snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={4}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
