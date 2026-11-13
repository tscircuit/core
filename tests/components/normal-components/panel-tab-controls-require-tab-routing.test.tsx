import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel tab controls require tab-routing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" tabLength="3mm" panelizationMethod="none">
      <board name="B1" width="20mm" height="20mm" routingDisabled />
      <paneltab
        boardName="B1"
        boardEdge="top"
        centerOffsetFromBoardLeftEdge={6}
      />
    </panel>,
  )

  await expect(
    circuit.renderUntilSettled(),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Panel tab controls require panelizationMethod="tab-routing""`,
  )
})
