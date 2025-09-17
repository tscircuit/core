import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment applies after auto-size", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorAlignment="bottom_right"
      boardAnchorPosition={{ x: 25, y: 30 }}
    >
      <resistor
        name="R_-5_-5"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={-5}
      />
      <resistor
        name="R_5_5"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={5}
      />
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="bottom_right(25,30)"
        anchorAlignment="bottom_right"
        pcbX={25}
        pcbY={30}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  const bottomRight = {
    x: pcb_board.center.x + pcb_board.width / 2,
    y: pcb_board.center.y + pcb_board.height / 2,
  }

  expect(bottomRight.x).toBeCloseTo(25, 6)
  expect(bottomRight.y).toBeCloseTo(30, 6)

  const notes = circuit.db.pcb_fabrication_note_text.list()
  const originNote = notes.find((note) => note.text === "(0,0)")
  const bottomRightNote = notes.find(
    (note) => note.text === "bottom_right(25,30)",
  )

  expect(originNote?.anchor_position).toEqual({ x: 0, y: 0 })
  expect(bottomRightNote?.anchor_position).toEqual({ x: 25, y: 30 })
})
