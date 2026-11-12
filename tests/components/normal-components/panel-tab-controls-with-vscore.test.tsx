import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("vScore is rejected together with panel tab controls", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      tabLength="3mm"
      panelizationMethod="tab-routing"
      vScore
    >
      <board name="B1" width="20mm" height="20mm" routingDisabled />
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
    `"vScore is not supported with tabCountPerEdge, <paneltab> or <paneltabkeepout>"`,
  )
})
