import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("vScore replaces tab mouse bites with V-score lines", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={2}
      col={2}
      panelizationMethod="tab-routing"
      vScore
    >
      {Array.from({ length: 4 }, (_, boardIndex) => (
        <board key={boardIndex} width="14mm" height="18mm" routingDisabled>
          <pcbnotetext text="V-scored tabs" fontSize={0.6} />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showFabricationNotes: true,
  })

  // vScore turns off the default mouse bites, so the tabs have no holes.
  expect(circuit.db.pcb_hole.list()).toHaveLength(0)
  // Each of the 4 boards has one tab on each of its 4 edges.
  const tabCutouts = circuit.db.pcb_cutout.list()
  expect(tabCutouts.length).toBeGreaterThan(0)
  const scoreLines = circuit.db.pcb_fabrication_note_path.list()
  expect(scoreLines).toHaveLength(16)
  expect(
    scoreLines.every(
      (scoreLine) =>
        scoreLine.route.length === 2 && scoreLine.pcb_panel_id !== undefined,
    ),
  ).toBe(true)
})
