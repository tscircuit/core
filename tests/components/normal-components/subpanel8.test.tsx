import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel can now contain both boards and subpanels", () => {
  const { circuit } = getTestFixture()

  // This should NOT throw because panel now allows subpanels
  circuit.add(
    <panel width="100mm" height="100mm">
      <board width="10mm" height="10mm" routingDisabled pcbX={-20} pcbY={0} />
      <subpanel width="40mm" height="40mm" pcbX={20} pcbY={0}>
        <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Only the main panel creates pcb_panel
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(1)

  // Subpanel creates a pcb_group
  const groups = circuit.db.pcb_group.list()
  expect(groups.length).toBeGreaterThanOrEqual(1)
})
