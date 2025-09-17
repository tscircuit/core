import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Autosize with anchor: place two parts and check bottom_right alignment
test("autosized board respects bottom_right anchor position", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board boardAnchorPosition={{ x: 100, y: -50 }} boardAnchorAlignment="bottom_right">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={10} pcbY={0} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={-10} pcbY={0} />
    </board>,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  // For bottom_right, anchor is (center.x + w/2, center.y + h/2)
  expect(board.center.x + board.width / 2).toBe(100)
  expect(board.center.y + board.height / 2).toBe(-50)
})


