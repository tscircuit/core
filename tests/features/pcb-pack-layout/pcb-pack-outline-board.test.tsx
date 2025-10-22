import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with outline and pack layout", async () => {
  const { circuit } = getTestFixture()

  const outline = [
    { x: -4, y: 4 },
    { x: 4, y: -4 },
    { x: 4, y: 4 },
  ]

  circuit.add(
    <board outline={outline}>
      <resistor name="R2" resistance="1k" footprint="0402" />
      <capacitor name="C2" capacitance="100nF" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
