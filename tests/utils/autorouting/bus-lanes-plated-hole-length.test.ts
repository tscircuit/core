import { expect, test } from "bun:test"
import {
  BusLanesPipelineSolver,
  busLengthReports,
} from "@tscircuit/bus-lanes-solver"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("bus matching counts the planar length of a plated-hole passage once", () => {
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    defaultObstacleMargin: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -2, maxY: 3 },
    obstacles: [
      {
        type: "rect",
        center: { x: 0, y: 0 },
        width: 1.2,
        height: 1,
        layers: ["top", "inner1", "inner2", "bottom"],
        connectedTo: ["DATA0"],
      },
    ],
    connections: [
      {
        name: "DATA0",
        pointsToConnect: [
          { x: 1, y: 0, layer: "inner1" },
          { x: 4, y: 0, layer: "inner1" },
        ],
      },
      {
        name: "DATA1",
        pointsToConnect: [
          { x: -4, y: 2, layer: "inner1" },
          { x: 4, y: 2, layer: "inner1" },
        ],
      },
    ],
    buses: [
      {
        busId: "DATA",
        connectionNames: ["DATA0", "DATA1"],
        allowedLayers: ["inner1"],
        maxLengthSkew: 0.01,
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "fixed_data",
        connection_name: "DATA0",
        route: [
          { route_type: "wire", x: -4, y: 0, layer: "bottom", width: 0.1 },
          { route_type: "wire", x: -0.25, y: 0, layer: "bottom", width: 0.1 },
          {
            route_type: "through_obstacle",
            start: { x: -0.25, y: 0 },
            end: { x: 0.25, y: 0 },
            from_layer: "bottom",
            to_layer: "inner1",
            width: 0.1,
          },
          { route_type: "wire", x: 0.25, y: 0, layer: "inner1", width: 0.1 },
          { route_type: "wire", x: 1, y: 0, layer: "inner1", width: 0.1 },
        ],
      },
    ],
  }
  const original = structuredClone(input)
  const prepared = getBusLanesInputFromSrj(input)
  const solver = new BusLanesPipelineSolver(prepared)
  solver.solve()
  expect(solver.error).toBeNull()
  expect(solver.solved).toBe(true)
  const [report] = busLengthReports(prepared, solver.traces)
  expect(report.matched).toBe(true)
  expect(
    report.lengths.find((route) => route.name === "DATA0")!.fixedLengthMm,
  ).toBeCloseTo(5, 8)
  expect(
    report.lengths.every((route) => Math.abs(route.totalLengthMm! - 8) < 1e-8),
  ).toBe(true)
  expect(input).toEqual(original)
})
