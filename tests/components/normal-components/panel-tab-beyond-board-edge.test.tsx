import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <paneltab> cannot extend beyond its board edge", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" tabLength="3mm" panelizationMethod="tab-routing">
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <paneltab boardName="B1" boardEdge="top" offset={1} />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"A top tab on B1 extends beyond the board edge. Reduce tabLength or move the tab."`,
  )
})
