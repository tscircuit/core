import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Explicit size with top_left alignment anchors the board's top-left at position
test("board top_left alignment keeps anchor position fixed", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={40}
      height={30}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="top_left"
    />,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  // For top-left anchor, center should be (x + w/2, y + h/2)
  expect(board.center.x).toBe(20)
  expect(board.center.y).toBe(15)
})
