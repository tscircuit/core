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
        text="Solid: outline | dashed: center + size"
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
  circuit.db.pcb_note_text.insert({
    anchor_position: { x: 10, y: 25 },
    anchor_alignment: "center",
    text: `Emitted center: (${pcbBoard.center.x}, ${pcbBoard.center.y})`,
    font: "tscircuit2024",
    font_size: 0.8,
    layer: "top",
    color: "#4da6ff",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
