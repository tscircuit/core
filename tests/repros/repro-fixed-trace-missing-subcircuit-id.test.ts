import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("fixed copper inherits its known source trace scope without changing geometry", async () => {
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

  for (const input of [global, scoped]) {
    expect(input.traces).toEqual([
      expect.objectContaining({
        pcb_trace_id: "pcb_trace_power",
        source_trace_id: "source_trace_power",
        route: circuitJson[2].type === "pcb_trace" ? circuitJson[2].route : [],
      }),
    ])
  }
  expect(circuitJson).toEqual(original)

  for (const scope of [undefined, subcircuitId]) {
    expect(
      getSimpleRouteJsonFromCircuitJson({
        circuitJson,
        subcircuit_id: scope,
        ignoreExistingTopLevelPcbRouteState: true,
      }).simpleRouteJson.traces,
    ).toBeUndefined()
  }

  // An explicit physical scope takes priority; no ownership is invented for
  // source traces that also lack a scope.
  const explicitlyForeign = circuitJson.map((element) =>
    element.type === "pcb_trace"
      ? { ...element, subcircuit_id: "subcircuit_other" }
      : element,
  )
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: explicitlyForeign,
      subcircuit_id: subcircuitId,
    }).simpleRouteJson.traces,
  ).toBeUndefined()
  const unscoped = circuitJson.map((element) =>
    element.type === "source_trace"
      ? { ...element, subcircuit_id: undefined }
      : element,
  )
  expect(
    getSimpleRouteJsonFromCircuitJson({ circuitJson: unscoped }).simpleRouteJson
      .traces,
  ).toBeUndefined()

  await expect([
    ...circuitJson,
    {
      type: "pcb_fabrication_note_text",
      pcb_fabrication_note_text_id: "note",
      text: `Power copper exists; router preserves ${global.traces?.length ?? 0} trace`,
      anchor_position: { x: 0, y: 2 },
      anchor_alignment: "center",
      font_size: 0.4,
      layer: "top",
      color: "#ffffff",
      ccw_rotation: 0,
    },
  ]).toMatchPcbSnapshot(import.meta.path)
})
