import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTaperClearanceEnvelope } from "lib/utils/get-taper-clearance-envelope"

test("pour and DRC envelopes cover widening and narrowing without changing output copper", () => {
  const trace: PcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "t",
    route: [
      {
        route_type: "wire",
        x: 0,
        y: 0,
        layer: "top",
        width: 0.2,
        start_width: 0.2,
        end_width: 0.8,
        width_interpolation_mode: "quadratic",
      },
      {
        route_type: "wire",
        x: 1,
        y: 0,
        layer: "top",
        width: 0.8,
        start_width: 0.8,
        end_width: 0.2,
        width_interpolation_mode: "quadratic",
      },
      { route_type: "wire", x: 2, y: 0, layer: "top", width: 0.2 },
    ],
  }
  const original = structuredClone(trace)
  const [envelope] = getTaperClearanceEnvelope([trace]) as PcbTrace[]
  expect(
    envelope.route.map((p) => (p.route_type === "wire" ? p.width : 0)),
  ).toEqual([0.8, 0.8, 0.8])
  expect(envelope.route[0]).not.toHaveProperty("width_interpolation_mode")
  expect(trace).toEqual(original)
})
