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
    { name: "crosses_hole", y: 0, covered: false },
    { name: "covered", y: 1, covered: true },
    { name: "outside", y: 3, covered: false },
  ].map(({ name, y, covered }) => {
    const trace = db.pcb_trace.insert({
      source_trace_id: "gnd_trace",
      route: [
        { route_type: "wire", x: 0.1, y, layer: "top", width: 0.1 },
        { route_type: "wire", x: 9.9, y, layer: "top", width: 0.1 },
      ],
    })
    db.pcb_note_text.insert({
      text: name === "covered" ? "Covered: tagged" : `${name}: untagged`,
      anchor_position: { x: 5, y: y + 0.25 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.2,
      layer: "top",
    })
    return { traceId: trace.pcb_trace_id, covered }
  })

  markTraceSegmentsInsideCopperPour({ db, copperPour })
  for (const { traceId, covered } of traceExpectations) {
    const trace = db.pcb_trace.get(traceId)!
    for (const routePoint of trace.route) {
      if (covered) {
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
