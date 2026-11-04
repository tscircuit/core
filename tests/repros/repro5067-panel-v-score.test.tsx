import { expect, test } from "bun:test"
import { panelProps } from "@tscircuit/props"
import { createElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular zero-gap panels emit labelled full-span score annotations", async () => {
  const { circuit } = getTestFixture()
  let renderError: unknown
  try {
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
  } catch (error) {
    renderError = error
  }

  let snapshotCircuit = circuit
  if (renderError) {
    // A rejected panel produces no output; this is explicitly an input reference.
    snapshotCircuit = getTestFixture().circuit
    snapshotCircuit.add(
      <panel layoutMode="grid" row={2} col={2}>
        {Array.from({ length: 4 }, (_, boardIndex) => (
          <board key={boardIndex} width="14mm" height="18mm" routingDisabled>
            <pcbnotetext text="INPUT REFERENCE" pcbY={2} fontSize={0.6} />
            <pcbnotetext
              text="v_score rejected / no output"
              pcbY={-2}
              fontSize={0.5}
            />
          </board>
        ))}
      </panel>,
    )
  }
  await expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    showFabricationNotes: true,
  })
  expect(renderError).toBeUndefined()
  expect(panelProps.safeParse({ panelizationMethod: "v_score" }).success).toBe(
    true,
  )
  expect(circuit.db.pcb_cutout.list()).toHaveLength(0)
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(6)
  expect(
    circuit.db.pcb_fabrication_note_text
      .list()
      .every((note) => note.text === "V-SCORE"),
  ).toBe(true)
})
