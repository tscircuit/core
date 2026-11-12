import { expect, test } from "bun:test"
import { vector } from "@flatten-js/core"
import type { CircuitJson, PcbCutoutRect, Point } from "circuit-json"
import { getPanelMouseBitePositions } from "lib/utils/panels/get-panel-mouse-bite-positions"
import { preservePanelTabBridges } from "lib/utils/panels/preserve-panel-tab-bridges"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("intersecting routing channels cannot carry mouse bites beyond the preserved tab", async () => {
  // Circuit-world positions in mm, +X right/+Y up, right-handed +Z above.
  const bridgeOutline: Point[] = [
    { x: 0, y: -2.5 },
    { x: 4, y: -2.5 },
    { x: 4, y: 2.5 },
    { x: 0, y: 2.5 },
  ]
  const routingCutouts: PcbCutoutRect[] = [
    {
      type: "pcb_cutout",
      pcb_cutout_id: "local_route",
      shape: "rect",
      center: { x: 1, y: 0 },
      width: 2,
      height: 20,
    },
    {
      type: "pcb_cutout",
      pcb_cutout_id: "crossing_route",
      shape: "rect",
      center: { x: 10, y: 0 },
      width: 20,
      height: 4,
    },
  ]
  const positions = getPanelMouseBitePositions({
    mouseBites: [
      { boardEdge: { x: 0, y: 0 }, outwardNormal: vector(1, 0), bridgeOutline },
    ],
    routingCutouts,
    minimumDrillPitch: 1.35,
  })
  expect(positions).toEqual([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
  ])
  const circuitJson: CircuitJson = [
    {
      type: "pcb_panel",
      pcb_panel_id: "panel",
      center: { x: 8, y: 0 },
      width: 30,
      height: 26,
      thickness: 1.6,
      covered_with_solder_mask: true,
    },
    ...preservePanelTabBridges(routingCutouts, [bridgeOutline]),
    ...positions.map((position, drillIndex) => ({
      type: "pcb_hole" as const,
      pcb_hole_id: `drill_${drillIndex}`,
      hole_shape: "circle" as const,
      hole_diameter: 0.9,
      x: position.x,
      y: position.y,
    })),
    {
      type: "pcb_note_text",
      pcb_note_text_id: "note",
      text: "DRILLS STOP AT TAB / NOT FAR CHANNEL",
      font: "tscircuit2024",
      font_size: 0.9,
      anchor_position: { x: 8, y: 11 },
      anchor_alignment: "center",
      layer: "top",
    },
  ]
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
