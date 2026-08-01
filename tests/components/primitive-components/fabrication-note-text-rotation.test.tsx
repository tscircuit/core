import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication note text emits its global PCB rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <fabricationnotetext
        text="DIRECT 30 DEG"
        pcbX={-4}
        pcbY={2}
        pcbRotation={30}
      />
      <group pcbX={4} pcbY={-1} pcbRotation={20}>
        <fabricationnotetext text="GROUP 45 DEG" pcbRotation={25} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const fabricationNoteTexts = circuit.db.pcb_fabrication_note_text.list()
  expect(
    fabricationNoteTexts.map(({ text, ccw_rotation }) => ({
      text,
      ccw_rotation,
    })),
  ).toEqual([
    { text: "DIRECT 30 DEG", ccw_rotation: 30 },
    { text: "GROUP 45 DEG", ccw_rotation: 45 },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
