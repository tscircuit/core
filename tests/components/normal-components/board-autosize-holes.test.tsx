import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board autosize accounts for pcb holes", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <hole diameter="2mm" pcbX={10} pcbY={20} />
    </board>,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0]

  expect(board.width).toBeGreaterThan(0)
  expect(board.height).toBeGreaterThan(0)
  expect(board.center.x).toBeCloseTo(10)
  expect(board.center.y).toBeCloseTo(20)
})
