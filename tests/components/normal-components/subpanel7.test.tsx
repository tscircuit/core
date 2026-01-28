import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested subpanels work correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="150mm" height="150mm">
      <subpanel width="70mm" height="70mm" pcbX={-30} pcbY={0}>
        <subpanel width="30mm" height="30mm" pcbX={-15} pcbY={0}>
          <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
        </subpanel>
        <board width="10mm" height="10mm" routingDisabled pcbX={15} pcbY={0} />
      </subpanel>
      <board width="10mm" height="10mm" routingDisabled pcbX={30} pcbY={0} />
    </panel>,
  )

  circuit.render()

  const boards = circuit.db.pcb_board.list()
  expect(boards).toHaveLength(3)

  // Should have 3 pcb_panel entries: main panel + 2 subpanels
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(3)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
