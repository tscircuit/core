import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a board that no <paneltab> names would be cut free of the panel", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" tabLength="3mm" panelizationMethod="tab-routing">
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <board name="B2" width="20mm" height="20mm" routingDisabled />
      <paneltab
        boardName="B1"
        boardEdge="right"
        centerOffsetFromBoardBottomEdge="6mm"
      />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"B2 has no panel tabs and would be cut free of the panel. Add a <paneltab> for it or narrow its <paneltabkeepout>."`,
  )
})
