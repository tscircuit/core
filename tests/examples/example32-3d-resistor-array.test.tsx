import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example32 3d snapshot resistor array", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} pcbY={6} />
      <resistor name="R2" resistance="2k" footprint="0402" pcbX={-4} pcbY={2} />
      <resistor name="R3" resistance="3k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R4" resistance="4k" footprint="0402" pcbX={4} pcbY={-2} />
      <resistor name="R5" resistance="5k" footprint="0402" pcbX={8} pcbY={-6} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
