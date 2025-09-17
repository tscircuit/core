import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with grouped components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={5}
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={-5}
        />
      </group>
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left"
        anchorAlignment="top_left"
        pcbX={-5.610576923076923}
        pcbY={5.278846153846154}
      />
    </board>,
  )

  circuit.render()

  const pcb_board = circuit.db.pcb_board.list()[0]
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
  expect(pcb_board.width).toBeGreaterThan(10)
  expect(pcb_board.height).toBeGreaterThan(10)

  const notes = circuit.db.pcb_fabrication_note_text.list()
  const originNote = notes.find((note) => note.text === "(0,0)")
  const topLeftNote = notes.find((note) => note.text === "top_left")

  expect(originNote?.anchor_position).toEqual({ x: 0, y: 0 })

  const boardTopLeft = {
    x: pcb_board.center.x - pcb_board.width / 2,
    y: pcb_board.center.y + pcb_board.height / 2,
  }

  expect(topLeftNote?.anchor_position?.x).toBeCloseTo(boardTopLeft.x, 6)
  expect(topLeftNote?.anchor_position?.y).toBeCloseTo(boardTopLeft.y, 6)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
