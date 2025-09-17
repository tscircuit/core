import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board centers around components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(5)
  expect(pcb_board.center.y).toBe(0)
})
