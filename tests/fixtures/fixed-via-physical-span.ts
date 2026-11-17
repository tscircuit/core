import {
  pcb_board,
  pcb_trace,
  pcb_via,
  source_trace,
  type AnyCircuitElement,
  type LayerRef,
} from "circuit-json"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

export const physicalBoardLayers = [
  "top",
  "inner1",
  "inner2",
  "bottom",
] satisfies LayerRef[]

/** Existing copper at board-world points in mm, +X right, +Y up, +Z above.
 * The through barrel and the already-manufactured blind barrel are physical
 * facts. The current policy disallows NEW blind vias, without changing either
 * old barrel. No new routing or solver candidates are used by this diagnostic.
 */
export const getFixedViaPhysicalSpanFixture = () => {
  const throughTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "existing_through",
    connection_name: "through_signal",
    route: [
      { route_type: "wire", x: -5, y: 1, width: 0.2, layer: "top" },
      { route_type: "wire", x: -2, y: 1, width: 0.2, layer: "top" },
      {
        route_type: "via",
        x: -2,
        y: 1,
        from_layer: "top",
        to_layer: "inner1",
        via_diameter: 0.6,
        via_hole_diameter: 0.3,
      },
      { route_type: "wire", x: -2, y: 1, width: 0.2, layer: "inner1" },
      { route_type: "wire", x: 0, y: 1, width: 0.2, layer: "inner1" },
    ],
  }
  const blindTrace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "existing_blind",
    connection_name: "blind_signal",
    route: [
      { route_type: "wire", x: 0, y: -1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 2, y: -1, width: 0.2, layer: "top" },
      {
        route_type: "via",
        x: 2,
        y: -1,
        from_layer: "top",
        to_layer: "inner1",
        layers: ["top", "inner1"],
        via_diameter: 0.6,
        via_hole_diameter: 0.3,
      },
      { route_type: "wire", x: 2, y: -1, width: 0.2, layer: "inner1" },
      { route_type: "wire", x: 5, y: -1, width: 0.2, layer: "inner1" },
    ],
  }
  const input: SimpleRouteJson = {
    layerCount: 4,
    allowBlindAndBuriedVias: false,
    minTraceWidth: 0.2,
    minViaPadDiameter: 0.6,
    minViaHoleDiameter: 0.3,
    bounds: { minX: -6, maxX: 6, minY: -4, maxY: 4 },
    obstacles: [],
    connections: [],
    traces: [throughTrace, blindTrace],
  }
  const circuitJson: AnyCircuitElement[] = [
    pcb_board.parse({
      type: "pcb_board",
      pcb_board_id: "board",
      center: { x: 0, y: 0 },
      width: 12,
      height: 8,
      num_layers: 4,
      min_trace_width: 0.2,
      min_via_pad_diameter: 0.6,
      min_via_hole_diameter: 0.3,
      allow_blind_and_buried_vias: false,
    }),
    ...[throughTrace, blindTrace].flatMap((trace) => {
      const via = trace.route.find((point) => point.route_type === "via")!
      return [
        source_trace.parse({
          type: "source_trace",
          source_trace_id: trace.connection_name,
          name:
            trace === throughTrace ? "Through signal" : "Existing blind signal",
          subcircuit_id: "board",
          connected_source_port_ids: [],
          connected_source_net_ids: [],
        }),
        pcb_trace.parse({
          ...trace,
          source_trace_id: trace.connection_name,
          subcircuit_id: "board",
          route: trace.route.map((point) =>
            point.route_type === "via"
              ? {
                  ...point,
                  outer_diameter: point.via_diameter,
                  hole_diameter: point.via_hole_diameter,
                }
              : point,
          ),
        }),
        pcb_via.parse({
          type: "pcb_via",
          pcb_via_id: `${trace.pcb_trace_id}_barrel`,
          pcb_trace_id: trace.pcb_trace_id,
          subcircuit_id: "board",
          x: via.x,
          y: via.y,
          outer_diameter: 0.6,
          hole_diameter: 0.3,
          layers:
            trace === throughTrace ? physicalBoardLayers : ["top", "inner1"],
          from_layer: "top",
          to_layer: "inner1",
        }),
      ]
    }),
  ]
  return { input, circuitJson }
}

export const observeFixedViaPhysicalSpans = ({
  input,
  circuitJson,
}: ReturnType<typeof getFixedViaPhysicalSpanFixture>) => {
  const physicalVias = circuitJson.filter(
    (element) => element.type === "pcb_via",
  )
  const throughLayers = physicalVias.find(
    (via) => via.pcb_trace_id === "existing_through",
  )!.layers
  const blindLayers = physicalVias.find(
    (via) => via.pcb_trace_id === "existing_blind",
  )!.layers
  const direct = getBusLanesInputFromSrj(input)
  const recovered = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  }).simpleRouteJson
  const recoveredBus = getBusLanesInputFromSrj(recovered)
  const getSpan = (
    traces: SimpleRouteJson["traces"],
    traceId: SimplifiedPcbTrace["pcb_trace_id"],
  ) =>
    traces
      ?.find((trace) => trace.pcb_trace_id === traceId)
      ?.route.find((point) => point.route_type === "via")?.layers
  return {
    direct,
    recovered,
    recoveredBus,
    rows: [
      {
        label: "Direct implicit through",
        physicalLayers: throughLayers,
        exportedLayers: getSpan(direct.traces, "existing_through"),
      },
      {
        label: "Direct explicit old blind",
        physicalLayers: blindLayers,
        exportedLayers: getSpan(direct.traces, "existing_blind"),
      },
      {
        label: "Recovered stored through",
        physicalLayers: throughLayers,
        exportedLayers: getSpan(recoveredBus.traces, "existing_through"),
      },
      {
        label: "Recovered stored blind",
        physicalLayers: blindLayers,
        exportedLayers: getSpan(recoveredBus.traces, "existing_blind"),
      },
    ],
  }
}
