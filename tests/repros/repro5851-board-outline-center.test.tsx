import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro5851: outlined board emits a displaced bounding box", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      outline={[
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 15 },
        { x: 20, y: 15 },
        { x: 20, y: 30 },
        { x: 0, y: 30 },
      ]}
    >
      <pcbnotetext
        pcbX={20}
        pcbY={5}
        fontSize={0.7}
        text="Solid: outline | dashed: bounds | yellow: center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbBoard = circuit.db.pcb_board.list()[0]
  // Pin the known-bad baseline for #5851; the stacked fix updates this assertion.
  expect(pcbBoard).toMatchObject({
    center: { x: 0, y: 0 },
    width: 40,
    height: 30,
    outline: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 15 },
      { x: 20, y: 15 },
      { x: 20, y: 30 },
      { x: 0, y: 30 },
    ],
  })

  // Visualize emitted circuit-world bounds in mm (+X right, +Y top, +Z above,
  // right-handed). The center is a position, not a local translation vector.
  circuit.db.pcb_note_rect.insert({
    center: pcbBoard.center,
    width: pcbBoard.width!,
    height: pcbBoard.height!,
    layer: "top",
    stroke_width: 0.2,
    is_filled: false,
    has_stroke: true,
    is_stroke_dashed: true,
    color: "#4da6ff",
  })
  circuit.db.pcb_note_rect.insert({
    center: pcbBoard.center,
    width: 2,
    height: 2,
    corner_radius: 1,
    layer: "top",
    stroke_width: 0.25,
    is_filled: false,
    has_stroke: true,
    color: "#ffcc00",
  })
  circuit.db.pcb_note_rect.insert({
    center: pcbBoard.center,
    width: 0.4,
    height: 0.4,
    corner_radius: 0.2,
    layer: "top",
    stroke_width: 0,
    is_filled: true,
    has_stroke: false,
    color: "#ffcc00",
  })
  circuit.db.pcb_note_line.insert({
    x1: pcbBoard.center.x + 0.8,
    y1: pcbBoard.center.y + 0.8,
    x2: pcbBoard.center.x + 2.5,
    y2: pcbBoard.center.y + 2.5,
    layer: "top",
    stroke_width: 0.2,
    color: "#ffcc00",
  })
  circuit.db.pcb_note_text.insert({
    anchor_position: {
      x: pcbBoard.center.x + 3,
      y: pcbBoard.center.y + 3,
    },
    anchor_alignment: "bottom_left",
    text: `Center (${pcbBoard.center.x}, ${pcbBoard.center.y})`,
    font: "tscircuit2024",
    font_size: 1,
    layer: "top",
    color: "#ffcc00",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
