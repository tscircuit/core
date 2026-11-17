import { expect, test } from "bun:test"
import {
  pcb_trace,
  pcb_via,
  source_trace,
  type AnyCircuitElement,
} from "circuit-json"
import type { H3RoutingStage } from "tests/fixtures/h3-routing-phase-intent/run"
import { getNativeH3CopperPreservation } from "tests/fixtures/h3-routing-phase-intent/copper"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

test("native copper audit accepts split reversed traces and checks physical via dimensions and span", () => {
  const trace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "byte_route",
    connection_name: "ddr_signal",
    route: [
      { route_type: "wire", x: -2, y: 0, width: 0.1, layer: "top" },
      { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
      { route_type: "via", x: 0, y: 0, from_layer: "top", to_layer: "bottom" },
      { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "bottom" },
      { route_type: "wire", x: 2, y: 0, width: 0.1, layer: "bottom" },
    ],
  }
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    minViaPadDiameter: 0.6,
    minViaHoleDiameter: 0.3,
    bounds: { minX: -3, maxX: 3, minY: -2, maxY: 2 },
    obstacles: [],
    connections: [],
    traces: [trace],
  }
  const stage: H3RoutingStage = {
    start: {
      type: "autorouting:start",
      subcircuit_id: "board",
      componentDisplayName: "Native copper audit",
      simpleRouteJson: input,
    },
    end: {
      type: "autorouting:end",
      subcircuit_id: "board",
      componentDisplayName: "Native copper audit",
      simpleRouteJson: input,
    },
  }
  const stages = [stage, stage]
  const circuitJson: AnyCircuitElement[] = [
    source_trace.parse({
      type: "source_trace",
      source_trace_id: "net_member",
      connected_source_net_ids: ["ddr_signal"],
      connected_source_port_ids: [],
    }),
    ...[
      { pcb_trace_id: "split_top_a", layer: "top", start: -1, end: -2 },
      { pcb_trace_id: "split_top_b", layer: "top", start: 0, end: -1 },
      { pcb_trace_id: "split_bottom", layer: "bottom", start: 2, end: 0 },
    ].map(({ pcb_trace_id, layer, start, end }) =>
      pcb_trace.parse({
        type: "pcb_trace",
        pcb_trace_id,
        source_trace_id: "net_member",
        route: [
          { route_type: "wire", x: start, y: 0, width: 0.1, layer },
          { route_type: "wire", x: end, y: 0, width: 0.1, layer },
        ],
      }),
    ),
    pcb_via.parse({
      type: "pcb_via",
      pcb_via_id: "shared_via",
      pcb_trace_id: "split_bottom",
      x: 0,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "inner1", "inner2", "bottom"],
    }),
  ]
  const audit = (copper: AnyCircuitElement[]) =>
    getNativeH3CopperPreservation({ stages, circuitJson: copper })
  expect(audit(circuitJson)).toEqual({
    initialToByte0Preserved: true,
    byte0ToByte1Preserved: true,
    byte1ToFinalPreserved: true,
  })
  for (const change of [
    { outer_diameter: 0.7 },
    { hole_diameter: 0.35 },
    { layers: ["top", "bottom"] },
    { x: 0.01 },
  ]) {
    expect(
      audit(
        circuitJson.map((element) =>
          element.type === "pcb_via"
            ? pcb_via.parse({ ...element, ...change })
            : element,
        ),
      ).byte1ToFinalPreserved,
    ).toBe(false)
  }
  expect(
    audit(circuitJson.filter((element) => element.type !== "pcb_via"))
      .byte1ToFinalPreserved,
  ).toBe(false)
  expect(
    audit(
      circuitJson.filter(
        (element) =>
          element.type !== "pcb_trace" ||
          element.pcb_trace_id !== "split_top_a",
      ),
    ).byte1ToFinalPreserved,
  ).toBe(false)
  expect(
    audit(
      circuitJson.map((element) =>
        element.type === "pcb_trace"
          ? { ...element, source_trace_id: "another_net" }
          : element,
      ),
    ).byte1ToFinalPreserved,
  ).toBe(false)
  const blindTrace: SimplifiedPcbTrace = {
    ...trace,
    route: trace.route.map((point) =>
      point.route_type === "via"
        ? { ...point, to_layer: "inner1", layers: ["top", "inner1"] }
        : point.route_type === "wire" && point.layer === "bottom"
          ? { ...point, layer: "inner1" }
          : point,
    ),
  }
  const blindInput: SimpleRouteJson = {
    ...input,
    allowBlindAndBuriedVias: false,
    traces: [blindTrace],
  }
  const blindStages = stages.map((stage) => ({
    ...stage,
    start: { ...stage.start, simpleRouteJson: blindInput },
    end: { ...stage.end!, simpleRouteJson: blindInput },
  }))
  const blindCircuit: AnyCircuitElement[] = circuitJson.map((element) =>
    element.type === "pcb_via"
      ? { ...element, layers: ["top", "inner1"] }
      : element.type === "pcb_trace"
        ? {
            ...element,
            route: element.route.map((point) =>
              point.route_type === "wire" && point.layer === "bottom"
                ? { ...point, layer: "inner1" as const }
                : point,
            ),
          }
        : element,
  )
  expect(
    getNativeH3CopperPreservation({
      stages: blindStages,
      circuitJson: blindCircuit,
    }),
  ).toEqual({
    initialToByte0Preserved: true,
    byte0ToByte1Preserved: true,
    byte1ToFinalPreserved: true,
  })
})
