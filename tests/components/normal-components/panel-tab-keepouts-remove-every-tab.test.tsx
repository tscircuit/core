import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepouts that remove every tab from a board are rejected", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      tabLength="3mm"
      tabCountPerEdge={1}
      panelizationMethod="tab-routing"
    >
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <paneltabkeepout boardEdge="top" from="0mm" to="20mm" />
      <paneltabkeepout boardEdge="right" from="0mm" to="20mm" />
      <paneltabkeepout boardEdge="bottom" from="0mm" to="20mm" />
      <paneltabkeepout boardEdge="left" from="0mm" to="20mm" />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"B1 has no panel tabs and would be cut free of the panel. Add a <paneltab> for it or narrow its <paneltabkeepout>."`,
  )
})
