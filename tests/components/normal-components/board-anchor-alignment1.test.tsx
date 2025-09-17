import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Explicit width/height with center anchor at a given position
test("board centers at boardAnchorPosition with center alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={30} boardAnchorPosition={{ x: 10, y: 20 }} boardAnchorAlignment="center" />,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  expect(board.width).toBe(40)
  expect(board.height).toBe(30)
  expect(board.center.x).toBe(10)
  expect(board.center.y).toBe(20)
})


