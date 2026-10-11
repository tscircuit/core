import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("fixed copper disappears when its scope exists only on the source trace", async () => {
  const subcircuitId = "subcircuit_power"
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 12,
      height: 8,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_power",
      subcircuit_id: subcircuitId,
      connected_source_port_ids: [],
      connected_source_net_ids: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_power",
      source_trace_id: "source_trace_power",
      route: [
        { route_type: "wire", x: -4, y: 0, layer: "top", width: 0.8 },
        { route_type: "wire", x: 4, y: 0, layer: "top", width: 0.8 },
      ],
    },
  ]
  const original = structuredClone(circuitJson)
  const global = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  }).simpleRouteJson
  const scoped = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    subcircuit_id: subcircuitId,
  }).simpleRouteJson

  // This is the AM3352 failure: source ownership is known, yet actual copper
  // is absent from both the global and scoped routing inputs.
  expect(global.traces).toBeUndefined()
  expect(scoped.traces).toBeUndefined()
  expect(circuitJson).toEqual(original)

  await expect([
    ...circuitJson,
    {
      type: "pcb_fabrication_note_text",
      pcb_fabrication_note_text_id: "note",
      text: `Power copper exists; router preserves ${global.traces?.length ?? 0} traces`,
      anchor_position: { x: 0, y: 2 },
      anchor_alignment: "center",
      font_size: 0.4,
      layer: "top",
      color: "#ffffff",
      ccw_rotation: 0,
    },
  ]).toMatchPcbSnapshot(import.meta.path)
})
