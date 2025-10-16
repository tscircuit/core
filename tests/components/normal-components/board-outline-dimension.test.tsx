import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board outline dimension is calculated correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={[
        { x: -8, y: -8 },
        { x: 8, y: -8 },
        { x: 8, y: 8 },
        { x: -8, y: 8 },
      ]}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.width).toBe(16)
  expect(pcb_board.height).toBe(16)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
