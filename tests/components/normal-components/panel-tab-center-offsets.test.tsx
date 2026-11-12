import * as Flatten from "@flatten-js/core"
import { expect, test } from "bun:test"
import type { PcbCutout, PcbHoleCircle } from "circuit-json"
import { getPanelRoutingSlotPolygon } from "lib/utils/panels/get-panel-routing-slot-polygon"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("center offsets place tabs on every edge without neighbouring slots cutting them", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" panelizationMethod="tab-routing" tabLength="3mm">
      <board name="B1" width="30mm" height="20mm" routingDisabled />
      <board name="B2" width="30mm" height="20mm" routingDisabled />
      <paneltab
        boardName="B1"
        boardEdge="top"
        centerOffsetFromBoardLeftEdge="8mm"
      />
      <paneltab
        boardName="B1"
        boardEdge="left"
        centerOffsetFromBoardBottomEdge="5mm"
      />
      <paneltab
        boardName="B1"
        boardEdge="right"
        centerOffsetFromBoardTopEdge="5mm"
      />
      <paneltab
        boardName="B1"
        boardEdge="bottom"
        centerOffsetFromBoardRightEdge="8mm"
      />
      <paneltab
        boardName="B2"
        boardEdge="top"
        centerOffsetFromBoardRightEdge="6mm"
      />
      <paneltab
        boardName="B2"
        boardEdge="right"
        centerOffsetFromBoardTopEdge="10mm"
      />
      <paneltab
        boardName="B2"
        boardEdge="left"
        centerOffsetFromBoardBottomEdge="5mm"
      />
      <paneltab
        boardName="B2"
        boardEdge="bottom"
        centerOffsetFromBoardLeftEdge="6mm"
      />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  // B1's right tab and B2's left tab sit between the boards, where each
  // board's routing slot would otherwise cut the other board's tab.
  const routingSlots = circuit.db.pcb_cutout
    .list()
    .map((cutout) => getPanelRoutingSlotPolygon(cutout as PcbCutout))
  const mouseBiteHoles = circuit.db.pcb_hole.list() as PcbHoleCircle[]
  expect(mouseBiteHoles).toHaveLength(16)
  expect(
    mouseBiteHoles.filter((hole) =>
      routingSlots.some((slot) => slot.contains(Flatten.point(hole.x, hole.y))),
    ),
  ).toEqual([])
})
