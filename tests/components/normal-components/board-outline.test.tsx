import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board support outline without width and height", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={[
        { x: -8, y: -6 },
        { x: 0, y: -6 },
        { x: 10, y: 10 },
        { x: 5, y: 10 },
      ]}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
