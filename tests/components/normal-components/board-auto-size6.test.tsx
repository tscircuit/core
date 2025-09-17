import { expect, test } from "bun:test"
import { getAnchorOffsetFromCenter } from "lib/utils/components/get-anchor-offset-from-center"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with grouped components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <resistor
          name="R_5_5"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={5}
        />
        <resistor
          name="R_-5_-5"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={-5}
        />
      </group>
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left(pending)"
        anchorAlignment="top_left"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
  expect(pcb_board.width).toBeGreaterThan(10)
  expect(pcb_board.height).toBeGreaterThan(10)

  const topLeftOffset = getAnchorOffsetFromCenter(
    "top_left",
    pcb_board.width,
    pcb_board.height,
  )
  const boardTopLeft = {
    x: pcb_board.center.x + topLeftOffset.x,
    y: pcb_board.center.y + topLeftOffset.y,
  }

  const topLeftLabel = `top_left(${boardTopLeft.x.toFixed(2)},${boardTopLeft.y.toFixed(2)})`

  const notes = circuit.db.pcb_fabrication_note_text.list()
  const originNote = notes.find((note) => note.text === "(0,0)")
  const topLeftNote = notes.find((note) => note.text === "top_left(pending)")

  const topLeftNoteId = topLeftNote?.pcb_fabrication_note_text_id

  expect(originNote).toBeDefined()
  expect(topLeftNoteId).toBeDefined()

  if (topLeftNoteId) {
    circuit.db.pcb_fabrication_note_text.update(topLeftNoteId, {
      text: topLeftLabel,
      anchor_position: boardTopLeft,
    })
  }

  const updatedNotes = circuit.db.pcb_fabrication_note_text.list()
  const updatedTopLeftNote = updatedNotes.find(
    (note) => note.pcb_fabrication_note_text_id === topLeftNoteId,
  )

  expect(originNote?.anchor_position).toEqual({ x: 0, y: 0 })
  expect(updatedTopLeftNote?.text).toBe(topLeftLabel)
  expect(updatedTopLeftNote?.anchor_position?.x).toBeCloseTo(
    boardTopLeft.x,
    6,
  )
  expect(updatedTopLeftNote?.anchor_position?.y).toBeCloseTo(
    boardTopLeft.y,
    6,
  )

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
