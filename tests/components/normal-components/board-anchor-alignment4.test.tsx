import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Outline offsets should shift final center after anchor is applied
test("outline offsets are applied after anchor positioning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={10}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="center"
      outlineOffsetX={2}
      outlineOffsetY={-3}
    />,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  expect(board.center.x).toBe(2)
  expect(board.center.y).toBe(-3)
})
