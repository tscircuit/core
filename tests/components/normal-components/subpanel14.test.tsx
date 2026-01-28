import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel auto-calculates dimensions when not provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="150mm" height="150mm">
      <subpanel layoutMode="grid" edgePadding={5}>
        <board width="10mm" height="10mm" routingDisabled />
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  // Find the subpanel (not the main 150mm panel)
  const panels = circuit.db.pcb_panel.list()
  const subpanel = panels.find((p) => p.width !== 150)

  // Subpanel should have auto-calculated dimensions based on boards + edge padding
  expect(subpanel).toBeDefined()
  expect(subpanel!.width).toBeGreaterThan(0)
  expect(subpanel!.height).toBeGreaterThan(0)
})
