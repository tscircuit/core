import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel with panelizationMethod generates tabs and mouse bites", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel layoutMode="grid" panelizationMethod="tab-routing" boardGap={2}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Check for tab cutouts or mouse bite holes
  const cutouts = circuit.db.pcb_cutout.list()
  const holes = circuit.db.pcb_hole.list()

  // Should have either cutouts or holes from panelization
  expect(cutouts.length + holes.length).toBeGreaterThan(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
