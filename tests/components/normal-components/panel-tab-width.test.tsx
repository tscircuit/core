import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a <paneltab> tabWidth sets that tab's span along the board edge", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" panelizationMethod="tab-routing" tabLength="3mm">
      <board name="B1" width="30mm" height="20mm" routingDisabled />
      <paneltab
        boardName="B1"
        boardEdge="top"
        centerOffsetFromBoardLeftEdge="8mm"
      />
      <paneltab
        boardName="B1"
        boardEdge="bottom"
        centerOffsetFromBoardLeftEdge="15mm"
        tabWidth="6mm"
      />
    </panel>,
  )
  await circuit.renderUntilSettled()

  // The 6 mm bottom tab carries a longer row of mouse bites than the
  // 3 mm (tabLength) top tab.
  const holes = circuit.db.pcb_hole.list()
  expect({
    topTabHoles: holes.filter((hole) => hole.y > 0).length,
    bottomTabHoles: holes.filter((hole) => hole.y < 0).length,
  }).toMatchInlineSnapshot(`
    {
      "bottomTabHoles": 4,
      "topTabHoles": 2,
    }
  `)
})
