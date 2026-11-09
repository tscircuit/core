import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an explicit <paneltab> cannot overlap a <paneltabkeepout>", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" tabLength="3mm" panelizationMethod="tab-routing">
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <paneltab boardName="B1" boardEdge="top" offset={3} />
      <paneltabkeepout boardName="B1" boardEdge="top" from="2mm" to="4mm" />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"An explicit top tab on B1 overlaps a tab keepout"`,
  )
})
