import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board per-side finish and assembly props reach pcb_board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      solderMaskColor="green"
      topSolderMaskColor="black"
      bottomSolderMaskColor="red"
      silkscreenColor="white"
      topSilkscreenColor="yellow"
      bottomSilkscreenColor="white"
      doubleSidedAssembly
    />,
  )

  await circuit.renderUntilSettled()

  const pcb_board = circuit.db.pcb_board.list()[0] as {
    solder_mask_color?: string
    top_solder_mask_color?: string
    bottom_solder_mask_color?: string
    silkscreen_color?: string
    top_silkscreen_color?: string
    bottom_silkscreen_color?: string
    double_sided_assembly?: boolean
  }

  expect(pcb_board.solder_mask_color).toBe("green")
  expect(pcb_board.top_solder_mask_color).toBe("black")
  expect(pcb_board.bottom_solder_mask_color).toBe("red")
  expect(pcb_board.silkscreen_color).toBe("white")
  expect(pcb_board.top_silkscreen_color).toBe("yellow")
  expect(pcb_board.bottom_silkscreen_color).toBe("white")
  expect(pcb_board.double_sided_assembly).toBe(true)
})

test("default board does not emit double_sided_assembly on pcb_board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<board width={20} height={20} />)

  await circuit.renderUntilSettled()

  const pcb_board = circuit.db.pcb_board.list()[0] as {
    double_sided_assembly?: boolean
  }

  expect(pcb_board.double_sided_assembly).toBeUndefined()
})
