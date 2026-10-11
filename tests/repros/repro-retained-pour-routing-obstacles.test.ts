import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbCopperPour } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

// Board-world points in millimeters, right-handed (+X right, +Y up, +Z above).
const retainedPour: PcbCopperPour = {
  type: "pcb_copper_pour",
  pcb_copper_pour_id: "pcb_copper_pour_retained",
  source_net_id: "source_net_power",
  layer: "top",
  covered_with_solder_mask: true,
  shape: "brep",
  brep_shape: {
    outer_ring: {
      vertices: [
        { x: -3, y: -2 },
        { x: -3, y: 2 },
        { x: 3, y: 2 },
        { x: 3, y: -2 },
      ],
    },
    inner_rings: [
      {
        vertices: [
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
      },
    ],
  },
}

const circuitJson: AnyCircuitElement[] = [
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 12,
    height: 9,
    num_layers: 2,
    thickness: 1.6,
    material: "fr4",
  },
  {
    type: "source_net",
    source_net_id: "source_net_power",
    name: "POWER",
    member_source_group_ids: [],
  },
  retainedPour,
]

test("retained copper pours are present in routing obstacles", async () => {
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const directObstacles = getObstaclesFromCircuitJson(circuitJson)
  const notes: AnyCircuitElement[] = [
    {
      type: "pcb_fabrication_note_text",
      pcb_fabrication_note_text_id: "pcb_fabrication_note_text_0",
      pcb_component_id: "pcb_component_notes",
      layer: "top",
      anchor_position: { x: 0, y: 3.5 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.35,
      text: `Retained POWER copper: ${simpleRouteJson.obstacles.length} router obstacles`,
      ccw_rotation: 0,
      color: "#ffffff",
    },
    {
      type: "pcb_fabrication_note_text",
      pcb_fabrication_note_text_id: "pcb_fabrication_note_text_1",
      pcb_component_id: "pcb_component_notes",
      layer: "top",
      anchor_position: { x: 0, y: -3.5 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.35,
      text: "Red: existing copper. Green: obstacles. Central cutout stays open.",
      ccw_rotation: 0,
      color: "#ffffff",
    },
    ...simpleRouteJson.obstacles.map((obstacle, index) => ({
      type: "pcb_fabrication_note_rect" as const,
      pcb_fabrication_note_rect_id: `pcb_fabrication_note_rect_${index}`,
      pcb_component_id: "pcb_component_notes",
      layer: "top" as const,
      center: obstacle.center,
      width: obstacle.width,
      height: obstacle.height,
      stroke_width: 0.025,
      has_stroke: true,
      is_stroke_dashed: false,
      is_filled: false,
      color: "#00ff88",
    })),
  ]
  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, ...notes]),
  ).toMatchSvgSnapshot(import.meta.path)
  // Reproduction branch pins the omission. The stacked fix changes these to
  // coverage and open-cutout assertions against exactly the same copper.
  expect(directObstacles).toEqual([])
  expect(simpleRouteJson.obstacles).toEqual([])
})
