import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment applies after auto-size", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorAlignment="bottom_right"
      boardAnchorPosition={{ x: 25, y: 30 }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-5} pcbY={-5} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  const bottomRight = {
    x: pcb_board.center.x + pcb_board.width / 2,
    y: pcb_board.center.y + pcb_board.height / 2,
  }

  expect(bottomRight.x).toBeCloseTo(25, 6)
  expect(bottomRight.y).toBeCloseTo(30, 6)
})
