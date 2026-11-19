import { expect, test } from "bun:test"
import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type {
  Obstacle,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

// Actual H616 DDR crop: right-handed board-world points in mm;
// +X right, +Y up, +Z above.
// The completed DDR_003 data trace and U1 P2/P3/R2/R3 pads retain their captured
// geometry and connectivity. The trace crop retains its three coincident points.
test("H616 fixed via keeps its native circular copper footprint", async () => {
  const pads: Obstacle[] = [
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_205",
        pcb_port_id: "pcb_port_205",
        source_port_name: "BALL_P2",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.989999999999997, y: 16.049999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_205",
        "connectivity_net9",
        "source_trace_3",
        "source_port_205",
        "source_port_297",
        "pcb_port_205",
        "pcb_smtpad_297",
        "pcb_port_297",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_206",
        pcb_port_id: "pcb_port_206",
        source_port_name: "BALL_P3",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.989999999999997, y: 15.399999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_206",
        "connectivity_net1126",
        "source_port_206",
        "pcb_port_206",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_221",
        pcb_port_id: "pcb_port_221",
        source_port_name: "BALL_R2",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.3399999999999972, y: 16.049999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_221",
        "connectivity_net139",
        "source_trace_45",
        "source_port_221",
        "source_port_299",
        "pcb_port_221",
        "pcb_smtpad_299",
        "pcb_port_299",
      ],
    },
    {
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_222",
        pcb_port_id: "pcb_port_222",
        source_port_name: "BALL_R3",
      },
      componentId: "pcb_component_0",
      type: "rect",
      shape: "circle",
      layers: ["top"],
      center: { x: 1.3399999999999972, y: 15.399999999999997 },
      width: 0.35,
      height: 0.35,
      connectedTo: [
        "pcb_smtpad_222",
        "connectivity_net133",
        "source_trace_43",
        "source_port_222",
        "source_port_311",
        "pcb_port_222",
        "pcb_smtpad_311",
        "pcb_port_311",
      ],
    },
  ]
  const capturedVia = {
    route_type: "via" as const,
    x: 1.6650000000000003,
    y: 15.725,
    from_layer: "top",
    to_layer: "inner1",
    layers: ["top", "inner1", "inner2", "bottom"],
    via_diameter: 0.35,
    via_hole_diameter: 0.15,
  }
  const fixedTrace = {
    type: "pcb_trace" as const,
    pcb_trace_id: "bus_lane_source_trace_3",
    connection_name: "source_trace_3",
    source_trace_id: "source_trace_3",
    route: [
      {
        route_type: "wire",
        x: capturedVia.x,
        y: capturedVia.y,
        layer: "top",
        width: 0.0975,
      },
      capturedVia,
      {
        route_type: "wire",
        x: capturedVia.x,
        y: capturedVia.y,
        layer: "inner1",
        width: 0.0975,
      },
    ] satisfies SimplifiedPcbTrace["route"],
  }
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.093,
    minViaDiameter: 0.35,
    minViaPadDiameter: 0.35,
    minViaHoleDiameter: 0.15,
    minTraceToPadEdgeClearance: 0.1,
    minViaEdgeToPadEdgeClearance: 0.1,
    allowBlindAndBuriedVias: false,
    allowViaInPad: false,
    bounds: { minX: 1, maxX: 2.33, minY: 15, maxY: 16.45 },
    obstacles: pads,
    connections: [],
    traces: [fixedTrace],
  }
  const before = structuredClone(input)
  const output = withFixedTraces(input, new Set([fixedTrace.pcb_trace_id]))
  expect(output.obstacles).toEqual(pads)
  expect(output.traces).toEqual([{ ...fixedTrace, isFixed: true }])
  const via = output.traces![0]!.route.find(
    (point) => point.route_type === "via",
  )!
  expect(via).toEqual(capturedVia)
  expect(input).toEqual(before)

  const foreignPad = pads[3]!
  const centerDistance = Math.hypot(
    via.x - foreignPad.center.x,
    via.y - foreignPad.center.y,
  )
  const nativeGap =
    centerDistance - via.via_diameter! / 2 - foreignPad.width / 2
  expect(nativeGap).toBeGreaterThan(input.minViaEdgeToPadEdgeClearance!)
  expect(foreignPad.connectedTo).not.toContain(fixedTrace.connection_name!)

  await expect(
    getSvgFromGraphicsObject(convertSrjToGraphicsObject(output), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
