import { expect, test } from "bun:test"
import { getAnchorOffsetFromCenter } from "lib/utils/components/get-anchor-offset-from-center"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const within = (value: number, min: number, max: number) => {
  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

test("board anchor alignment holds when pcbPack auto-sizes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      pcbPack
      pcbGap="1mm"
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: -20, y: 15 }}
    >
      <resistor name="R_pack_1" resistance="10k" footprint="0402" />
      <capacitor name="C_pack_1" capacitance="1uF" footprint="0402" />
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left(-20,15)"
        anchorAlignment="top_left"
        pcbX={-20}
        pcbY={15}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  const topLeftOffset = getAnchorOffsetFromCenter(
    "top_left",
    board.width,
    board.height,
  )
  const boardTopLeft = {
    x: board.center.x + topLeftOffset.x,
    y: board.center.y + topLeftOffset.y,
  }

  expect(boardTopLeft.x).toBeCloseTo(-20, 6)
  expect(boardTopLeft.y).toBeCloseTo(15, 6)

  const notes = circuit.db.pcb_fabrication_note_text.list()
  const originNote = notes.find((note) => note.text === "(0,0)")
  const topLeftNote = notes.find((note) => note.text === "top_left(-20,15)")

  expect(originNote?.anchor_position).toEqual({ x: 0, y: 0 })
  expect(topLeftNote?.anchor_position).toEqual({ x: -20, y: 15 })

  const packedComponents = circuit.db.pcb_component
    .list()
    .filter((component) => component.pcb_board_id === board.pcb_board_id)

  const boardBounds = {
    minX: board.center.x - board.width / 2,
    maxX: board.center.x + board.width / 2,
    minY: board.center.y - board.height / 2,
    maxY: board.center.y + board.height / 2,
  }

  for (const component of packedComponents) {
    within(component.center.x, boardBounds.minX, boardBounds.maxX)
    within(component.center.y, boardBounds.minY, boardBounds.maxY)
  }

})
