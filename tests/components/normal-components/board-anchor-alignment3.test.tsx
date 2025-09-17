import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects bottom_right anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: -5, y: -5 }}
      boardAnchorAlignment="bottom_right"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Bottom-right alignment means the board's bottom-right corner should be at (-5,-5)
  // So center should be at (-width/2, -height/2) in PCB coordinates
  expect(pcb_board.center.x).toBe(-15)
  expect(pcb_board.center.y).toBe(-15)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path + "-bottom-right",
  )
})
