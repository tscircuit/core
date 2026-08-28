import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication note text respects its layer and parent component layer", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fabricationnotetext text="EXPLICIT BOTTOM" pcbY={2} layer="bottom" />
      <group layer="bottom" pcbY={-2}>
        <fabricationnotetext text="BOTTOM COMPONENT" />
      </group>
    </board>,
  )

  circuit.render()

  const fabricationNoteTexts = circuit.db.pcb_fabrication_note_text.list()
  expect(
    fabricationNoteTexts.map(({ text, layer }) => ({ text, layer })),
  ).toEqual([
    { text: "EXPLICIT BOTTOM", layer: "bottom" },
    { text: "BOTTOM COMPONENT", layer: "bottom" },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
