import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board solderMaskColor and silkscreenColor reach the pcb_board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      solderMaskColor="black"
      silkscreenColor="white"
    />,
  )

  await circuit.renderUntilSettled()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.solder_mask_color).toBe("black")
  expect(pcb_board.silkscreen_color).toBe("white")
})
