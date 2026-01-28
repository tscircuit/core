import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel creates pcb_group with center and dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" pcbX={0} pcbY={0}>
      <subpanel
        name="mySubpanel"
        width="50mm"
        height="30mm"
        pcbX={10}
        pcbY={20}
      >
        <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
      </subpanel>
    </panel>,
  )

  circuit.render()

  // Only the main panel should create pcb_panel
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(1)

  // Subpanel creates a pcb_group
  const groups = circuit.db.pcb_group.list()
  const subpanelGroup = groups.find((g) => g.name === "mySubpanel")
  expect(subpanelGroup).toBeDefined()
  expect(subpanelGroup!.width).toBe(50)
  expect(subpanelGroup!.height).toBe(30)
})
