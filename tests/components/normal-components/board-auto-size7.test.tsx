import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment adjusts explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={40}
      height={20}
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: 10, y: 20 }}
    >
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left(10,20)"
        anchorAlignment="top_left"
        pcbX={10}
        pcbY={20}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  const topLeft = {
    x: pcb_board.center.x - pcb_board.width / 2,
    y: pcb_board.center.y - pcb_board.height / 2,
  }

  expect(topLeft.x).toBeCloseTo(10, 6)
  expect(topLeft.y).toBeCloseTo(20, 6)

  const notes = circuit.db.pcb_fabrication_note_text.list()
  const originNote = notes.find((note) => note.text === "(0,0)")
  const topLeftNote = notes.find((note) => note.text === "top_left(10,20)")

  expect(originNote?.anchor_position).toEqual({ x: 0, y: 0 })
  expect(topLeftNote?.anchor_position).toEqual({ x: 10, y: 20 })
})
