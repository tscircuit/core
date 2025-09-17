import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with group is empty", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group></group>
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
})
