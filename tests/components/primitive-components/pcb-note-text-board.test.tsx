import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnotetext outside a footprint creates a global note text", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotetext
        pcbX={2}
        pcbY={3}
        text="Hello World"
        fontSize={1.5}
        anchorAlignment="center"
      />
    </board>,
  )

  circuit.render()

  const texts = circuit.db.pcb_note_text.list()
  expect(texts).toHaveLength(1)
  expect(texts[0]).toMatchObject({
    type: "pcb_note_text",
    text: "Hello World",
    anchor_position: { x: 2, y: 3 },
    font: "tscircuit2024",
    font_size: 1.5,
    anchor_alignment: "center",
  })
  expect(texts[0].pcb_component_id).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
