import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkHoleTraceClearance,
} from "@tscircuit/checks"
import { pcb_trace } from "circuit-json"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus routing accepts fixed plated-hole passages without adding vias or changing supplied copper", () => {
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.15,
    defaultObstacleMargin: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -3, maxY: 3 },
    obstacles: [
      {
        type: "rect",
        shape: "circle",
        center: { x: 0, y: 0 },
        width: 1,
        height: 1,
        layers: ["top", "inner1", "inner2", "bottom"],
        connectedTo: ["GND"],
      },
    ],
    connections: [0, 1.5].map((y, index) => ({
      name: `DATA${index}`,
      pointsToConnect: [
        { x: -4, y, layer: "top" },
        { x: 4, y, layer: "top" },
      ],
    })),
    buses: [
      {
        busId: "DATA",
        connectionNames: ["DATA0", "DATA1"],
        traceWidth: 0.15,
        allowedLayers: ["top"],
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_power",
        connection_name: "GND",
        route: [
          { route_type: "wire", x: -1, y: -1, layer: "bottom", width: 0.15 },
          { route_type: "wire", x: 0, y: 0, layer: "bottom", width: 0.15 },
          {
            route_type: "through_obstacle",
            start: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
            from_layer: "bottom",
            to_layer: "inner1",
            width: 0.15,
            circuitJsonMetadata: { pcb_plated_hole_id: "ground_hole" },
          },
          { route_type: "wire", x: 0, y: 0, layer: "inner1", width: 0.15 },
          { route_type: "wire", x: 1, y: 1, layer: "inner1", width: 0.15 },
        ],
      },
    ],
  }
  const original = structuredClone(input)
  const autorouter = new BusLanesAutorouter(input)
  const routes = autorouter.solveSync()
  expect(routes).toHaveLength(2)
  expect(input).toEqual(original)
  expect(
    routes
      .flatMap((trace) => trace.route)
      .every((point) => point.route_type === "wire" && point.layer === "top"),
  ).toBe(true)
  for (const connection of input.connections) {
    const trace = routes.find(
      (route) => route.connection_name === connection.name,
    )!
    expect(trace.route[0]).toMatchObject(connection.pointsToConnect[0])
    expect(trace.route.at(-1)).toMatchObject(connection.pointsToConnect[1])
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={6} layers={4} routingDisabled>
      <platedhole
        name="GND"
        shape="circle"
        outerDiameter={1}
        holeDiameter={0.4}
        pcbX={0}
        pcbY={0}
      />
      <pcbnotetext
        text="2/2 DATA routes on top; fixed GND passage through plated hole; no new vias"
        pcbX={0}
        pcbY={-2.4}
        fontSize={0.18}
      />
    </board>,
  )
  circuit.render()
  const json = [
    ...circuit.getCircuitJson(),
    ...[...original.traces!, ...routes].map((trace) =>
      pcb_trace.parse({
        ...trace,
        route: trace.route.map((segment) =>
          segment.route_type === "through_obstacle"
            ? {
                route_type: "through_pad",
                start: segment.start,
                end: segment.end,
                start_layer: segment.from_layer,
                end_layer: segment.to_layer,
                width: segment.width,
                pcb_plated_hole_id:
                  segment.circuitJsonMetadata?.pcb_plated_hole_id,
              }
            : segment,
        ),
      }),
    ),
  ]
  // Validate the new top-layer copper against the existing all-layer hole.
  // The retained GND trace occupies only bottom and inner1.
  const newCopper = json.filter(
    (element) =>
      element.type !== "pcb_trace" || element.pcb_trace_id !== "fixed_power",
  )
  expect(
    checkEachPcbTraceNonOverlapping(newCopper).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(
    checkHoleTraceClearance(newCopper).filter((finding) =>
      finding.type.endsWith("_error"),
    ),
  ).toHaveLength(0)
  expect(json.filter((element) => element.type === "pcb_via")).toHaveLength(0)
  expect(json).toMatchPcbSnapshot(import.meta.path, { backgroundColor: "white" })
})
