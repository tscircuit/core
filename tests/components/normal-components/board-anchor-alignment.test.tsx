import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchorAlignment aligns board center relative to boardAnchorPosition (#3100)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      boardAnchorPosition={{ x: 0, y: 0 }}
      anchorAlignment="top_left"
    />,
  )

  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard?.center.x).toBe(10)
  expect(pcbBoard?.center.y).toBe(-5)
})
