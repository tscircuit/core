import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects center_left anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="center_left"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Center-left alignment means the board's left edge center should be at (0,0)
  // So center should be at (width/2, 0)
  expect(pcb_board.center.x).toBe(10) // 20/2
  expect(pcb_board.center.y).toBe(0)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path + "-center-left",
  )
})
