import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel creates pcb_group for organizational grouping", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel width="50mm" height="50mm">
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  // Only Panel creates pcb_panel, Subpanel uses pcb_group
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(1)
  expect(panels[0].width).toBe(100)

  // Subpanel creates a pcb_group
  const groups = circuit.db.pcb_group.list()
  expect(groups.length).toBeGreaterThanOrEqual(1)
})
