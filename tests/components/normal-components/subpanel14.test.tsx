import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel auto-calculates dimensions when not provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="150mm" height="150mm">
      <subpanel name="autoSizedSubpanel" layoutMode="grid" edgePadding={5}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  // Only the main panel creates pcb_panel
  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(1)
  expect(panels[0].width).toBe(150)

  // Subpanel creates a pcb_group with auto-calculated dimensions
  const groups = circuit.db.pcb_group.list()
  const subpanelGroup = groups.find((g) => g.name === "autoSizedSubpanel")
  expect(subpanelGroup).toBeDefined()
  expect(subpanelGroup!.width).toBeGreaterThan(0)
  expect(subpanelGroup!.height).toBeGreaterThan(0)
})
