import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with relatively positioned components should not be packed", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" pcbX="-7mm" pcbY="0mm" />
      <resistor name="R1" resistance="10k" footprint="0805" />
      <led name="LED1" color="red" footprint="0603" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
