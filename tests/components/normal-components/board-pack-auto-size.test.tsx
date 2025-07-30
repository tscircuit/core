import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size ignores components outside board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pack gap="2mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor name="C1" capacitance="1000pF" footprint="0402" />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  circuit.add(
    <resistor
      name="R_OUT"
      resistance="1k"
      footprint="0402"
      pcbX={50}
      pcbY={0}
    />,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  expect(board.width).toBeLessThan(20)
  expect(board.height).toBeLessThan(20)
})
