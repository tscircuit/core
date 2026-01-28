import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel noSolderMask disables solder mask coverage", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel width="50mm" height="50mm" noSolderMask>
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const panels = circuit.db.pcb_panel.list()
  // Find the subpanel (the smaller one)
  const subpanel = panels.find((p) => p.width === 50)
  expect(subpanel?.covered_with_solder_mask).toBe(false)
})
