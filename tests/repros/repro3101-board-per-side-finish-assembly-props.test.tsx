import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board preserves per-side finish and assembly props on pcb_board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      topSolderMaskColor="red"
      bottomSolderMaskColor="blue"
      topSilkscreenColor="white"
      bottomSilkscreenColor="black"
      doubleSidedAssembly
    />,
  )

  circuit.render()

  const board = circuit.db.pcb_board.list()[0] as unknown as Record<
    string,
    unknown
  >

  expect(board).toBeDefined()
  expect(board.top_solder_mask_color).toBe("red")
  expect(board.bottom_solder_mask_color).toBe("blue")
  expect(board.top_silkscreen_color).toBe("white")
  expect(board.bottom_silkscreen_color).toBe("black")
  expect(board.double_sided_assembly).toBe(true)
})
