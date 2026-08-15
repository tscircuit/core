import { expect, test } from "bun:test"
import type { PcbCutoutRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel outline routing fully routes every board without tabs", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="80mm"
      height="50mm"
      layoutMode="grid"
      row={1}
      boardGap="4mm"
      tabWidth="2mm"
      tabLength="5mm"
      mouseBites
      panelizationMethod="outline_routing"
    >
      <board width="30mm" height="24mm" routingDisabled>
        <pcbnotetext
          text="OUTLINE ROUTING"
          pcbX={0}
          pcbY={0}
          fontSize="2mm"
          anchorAlignment="center"
        />
      </board>
      <board
        outline={[
          { x: -15, y: -12 },
          { x: 10, y: -12 },
          { x: 15, y: 0 },
          { x: 10, y: 12 },
          { x: -15, y: 12 },
        ]}
        routingDisabled
      >
        <pcbnotetext
          text="NO TABS"
          pcbX={0}
          pcbY={0}
          fontSize="2mm"
          anchorAlignment="center"
        />
      </board>
    </panel>,
  )

  circuit.render()

  const outlineRoutingCutouts = circuit.db.pcb_cutout.list()
  const mouseBiteHoles = circuit.db.pcb_hole.list()

  expect(outlineRoutingCutouts).toHaveLength(9)
  expect(
    outlineRoutingCutouts.every(
      (cutout) =>
        cutout.shape === "rect" &&
        cutout.pcb_cutout_id.startsWith("panel_outline_routing_cutout_") &&
        cutout.pcb_panel_id !== undefined &&
        cutout.pcb_board_id !== undefined,
    ),
  ).toBe(true)
  expect(
    (outlineRoutingCutouts as PcbCutoutRect[]).every(
      (cutout) => cutout.height === 2,
    ),
  ).toBe(true)
  expect(mouseBiteHoles).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})
