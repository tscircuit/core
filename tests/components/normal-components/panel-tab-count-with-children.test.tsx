import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("tabCountPerEdge cannot be combined with <paneltab> children", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      tabLength="3mm"
      tabCountPerEdge={2}
      panelizationMethod="tab-routing"
    >
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <paneltab boardName="B1" boardEdge="top" offset={6} />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Use either tabCountPerEdge or <paneltab> children"`,
  )
})
