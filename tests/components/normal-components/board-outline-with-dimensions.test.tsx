import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects explicit dimensions when outline is provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={30}
      height={25}
      outline={[
        { x: -8, y: -6 },
        { x: 0, y: -6 },
        { x: 10, y: 10 },
        { x: 5, y: 10 },
      ]}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  // Verify the board uses explicit dimensions, not outline-derived ones
  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.width).toBe(30)
  expect(pcb_board.height).toBe(25)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
