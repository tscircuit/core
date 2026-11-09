import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tab count and keepouts control where tabs are placed", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      panelizationMethod="tab-routing"
      tabLength="3mm"
      tabCountPerEdge={2}
    >
      <board name="B1" width="20mm" height="20mm" routingDisabled>
        <pcbnotetext text="2 tabs/edge; top keepout 0–7 mm" fontSize={0.6} />
      </board>
      <paneltabkeepout boardName="B1" boardEdge="top" from="0mm" to="7mm" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    showPcbGroups: false,
  })
  // Two tabs on each edge, except the first top tab whose span hits the keepout.
  expect(circuit.db.pcb_hole.list()).toHaveLength(14)
})
