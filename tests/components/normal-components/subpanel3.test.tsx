import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel can be nested inside panel with boards", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel width="50mm" height="50mm" pcbX={-20} pcbY={0}>
        <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
      </subpanel>
      <board width="10mm" height="10mm" routingDisabled pcbX={20} pcbY={0} />
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(2)

  // Should have 2 pcb_panel entries: one for main panel, one for subpanel
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(2)
})
