import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbCopperPour } from "circuit-json"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("covered traces respect BRep arcs and rotated rectangular pours", async () => {
  // Board-world points in mm (+X right, +Y up); the rectangle rotates CCW.
  const quarterCircleBulge = Math.tan(Math.PI / 8)
  const copperPours: PcbCopperPour[] = [
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "curved_pour",
      shape: "brep",
      layer: "top",
      source_net_id: "gnd",
      covered_with_solder_mask: false,
      brep_shape: {
        outer_ring: {
          vertices: [
            { x: 2, y: 0, bulge: quarterCircleBulge },
            { x: 0, y: 2, bulge: quarterCircleBulge },
            { x: -2, y: 0, bulge: quarterCircleBulge },
            { x: 0, y: -2, bulge: quarterCircleBulge },
          ],
        },
        inner_rings: [],
      },
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "rotated_pour",
      shape: "rect",
      layer: "top",
      source_net_id: "gnd",
      covered_with_solder_mask: false,
      center: { x: 6, y: 0 },
      width: 1,
      height: 4,
      rotation: 90,
    },
  ]
  const db = cju([
    ...copperPours,
    {
      type: "source_trace",
      source_trace_id: "gnd_trace",
      connected_source_net_ids: ["gnd"],
      connected_source_port_ids: [],
    },
  ])
  const curvedTrace = db.pcb_trace.insert({
    source_trace_id: "gnd_trace",
    route: [
      { route_type: "wire", x: -0.8, y: 1.6, layer: "top", width: 0.1 },
      { route_type: "wire", x: 0.8, y: 1.6, layer: "top", width: 0.1 },
    ],
  })
  const rotatedTrace = db.pcb_trace.insert({
    source_trace_id: "gnd_trace",
    route: [
      { route_type: "wire", x: 4.5, y: 0, layer: "top", width: 0.1 },
      { route_type: "wire", x: 7.5, y: 0, layer: "top", width: 0.1 },
    ],
  })
  for (const [pourIndex, copperPour] of copperPours.entries()) {
    markTraceSegmentsInsideCopperPour({ db, copperPour })
    db.pcb_note_text.insert({
      text:
        pourIndex === 0 ? "Arc, not chord: tagged" : "90-degree pour: tagged",
      anchor_position: { x: pourIndex * 6, y: -2.4 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.25,
      layer: "top",
    })
  }
  for (const [traceBeforeMarking, expectedPourId] of [
    [curvedTrace, "curved_pour"],
    [rotatedTrace, "rotated_pour"],
  ] as const) {
    const trace = db.pcb_trace.get(traceBeforeMarking.pcb_trace_id)!
    for (const routePoint of trace.route) {
      expect(routePoint).toHaveProperty("is_inside_copper_pour", true)
      expect(routePoint).toHaveProperty("copper_pour_id", expectedPourId)
    }
  }
  await expect(db.toArray()).toMatchPcbSnapshot(import.meta.path)
})
