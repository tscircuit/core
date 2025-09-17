import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment adjusts explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={40}
      height={20}
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: 10, y: 20 }}
    />,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  const topLeft = {
    x: pcb_board.center.x - pcb_board.width / 2,
    y: pcb_board.center.y - pcb_board.height / 2,
  }

  expect(topLeft.x).toBeCloseTo(10, 6)
  expect(topLeft.y).toBeCloseTo(20, 6)
})
