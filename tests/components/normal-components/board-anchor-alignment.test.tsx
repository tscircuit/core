import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchorAlignment prop positions the board like boardAnchorAlignment", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="30mm"
      height="20mm"
      boardAnchorPosition={{ x: 0, y: 0 }}
      anchorAlignment="top_left"
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  // top_left anchor at (0,0): center = (width/2, -height/2) = (15, -10)
  expect(pcbBoard.center.x).toBeCloseTo(15)
  expect(pcbBoard.center.y).toBeCloseTo(-10)
})
