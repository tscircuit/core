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
  // V-score lines emitted for the 16 tabs (4 boards, one tab per edge).
  expect(
    circuit.db.pcb_fabrication_note_path.list().length,
  ).toMatchInlineSnapshot(`16`)
})
