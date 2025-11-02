import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board width and height should be undefined when outline is provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={[
        { x: -8, y: -8 },
        { x: 8, y: -8 },
        { x: 8, y: 8 },
        { x: -8, y: 8 },
      ]}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]

  // EXPECTED: width and height should be undefined when outline is present
  expect(pcb_board.width).toBeUndefined()
  expect(pcb_board.height).toBeUndefined()

  // EXPECTED: outline should exist and have the correct points
  expect(pcb_board.outline).toBeDefined()
  expect(pcb_board.outline).toHaveLength(4)
})
