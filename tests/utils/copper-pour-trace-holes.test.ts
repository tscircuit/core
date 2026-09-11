import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbCopperPourBRep } from "circuit-json"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("trace coverage rejects narrow holes and ignores repeated ring vertices", async () => {
  // All coordinates are board-world points in mm, +X right and +Y up.
  const copperPour: PcbCopperPourBRep = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "pour_with_hole",
    shape: "brep",
    layer: "top",
    source_net_id: "gnd",
    covered_with_solder_mask: false,
    brep_shape: {
      outer_ring: {
        vertices: [
          { x: 0, y: -2 },
          { x: 10, y: -2 },
          { x: 10, y: 2 },
          { x: 0, y: 2 },
          { x: 0, y: -2 },
        ],
      },
      inner_rings: [
        {
          vertices: [
            { x: 1, y: -0.5 },
            { x: 1.5, y: -0.5 },
            { x: 1.5, y: 0.5 },
            { x: 1, y: 0.5 },
          ],
        },
      ],
    },
  }
  const db = cju([
    copperPour,
    {
      type: "source_trace",
      source_trace_id: "gnd_trace",
      connected_source_net_ids: ["gnd"],
      connected_source_port_ids: [],
    },
  ])
  const traceExpectations = [
    // Only the middle segment crosses the hole. Tagging both endpoints of
    // each covered neighbor must not make the middle segment look covered.
    {
      label: "Gap crossing: visible",
      y: 0,
      xs: [0.1, 0.8, 1.7, 9.9],
      expectedTags: [true, false, false, true],
    },
    {
      label: "Covered: hidden",
      y: 1,
      xs: [0.1, 9.9],
      expectedTags: [true, true],
    },
    {
      label: "Outside: visible",
      y: 3,
      xs: [0.1, 9.9],
      expectedTags: [false, false],
    },
  ].map(({ label, y, xs, expectedTags }) => {
    const trace = db.pcb_trace.insert({
      source_trace_id: "gnd_trace",
      route: xs.map((x) => ({
        route_type: "wire",
        x,
        y,
        layer: "top",
        width: 0.1,
      })),
    })
    db.pcb_note_text.insert({
      text: label,
      anchor_position: { x: 5, y: y + 0.25 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.2,
      layer: "top",
    })
    return { traceId: trace.pcb_trace_id, expectedTags }
  })

  markTraceSegmentsInsideCopperPour({ db, copperPour })
  for (const { traceId, expectedTags } of traceExpectations) {
    const trace = db.pcb_trace.get(traceId)!
    for (const [routePointIndex, routePoint] of trace.route.entries()) {
      if (expectedTags[routePointIndex]) {
        expect(routePoint).toHaveProperty("is_inside_copper_pour", true)
        expect(routePoint).toHaveProperty("copper_pour_id", "pour_with_hole")
      } else {
        expect(routePoint).not.toHaveProperty("is_inside_copper_pour", true)
        expect(routePoint).not.toHaveProperty("copper_pour_id")
      }
    }
  }
  await expect(db.toArray()).toMatchPcbSnapshot(import.meta.path)
})
