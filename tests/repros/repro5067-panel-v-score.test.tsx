import { expect, test } from "bun:test"
import { panelProps } from "@tscircuit/props"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular zero-gap panels emit labelled full-span score annotations", async () => {
  expect(panelProps.safeParse({ panelizationMethod: "v_score" }).success).toBe(
    true,
  )
  const { circuit } = getTestFixture()
  circuit.add(
    createElement(
      "panel",
      { layoutMode: "grid", row: 2, col: 2, panelizationMethod: "v_score" },
      ...Array.from({ length: 4 }, (_, boardIndex) => (
        <board key={boardIndex} width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="Rectangular board / V-score" fontSize={0.6} />
        </board>
      )),
    ),
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showFabricationNotes: true,
  })
  expect(circuit.db.pcb_cutout.list()).toHaveLength(0)
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(6)
  expect(
    circuit.db.pcb_fabrication_note_text
      .list()
      .every((note) => note.text === "V-SCORE"),
  ).toBe(true)
})
