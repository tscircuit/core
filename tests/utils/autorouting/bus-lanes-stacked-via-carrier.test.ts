import { expect, test } from "bun:test"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("bus carrier layers follow connected owned via spans independent of trace order", () => {
  const input: SimpleRouteJson = {
    layerCount: 4,
    allowBlindAndBuriedVias: true,
    minTraceWidth: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [
      {
        name: "DATA",
        pointsToConnect: [
          { x: 0, y: 0, layer: "bottom" },
          { x: 3, y: 0, layer: "inner2" },
        ],
      },
    ],
    buses: [
      {
        busId: "DATA_BUS",
        connectionNames: ["DATA"],
        allowedLayers: ["inner2"],
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "upper",
        connection_name: "DATA",
        route: [
          {
            route_type: "via",
            x: 0,
            y: 0,
            from_layer: "top",
            to_layer: "inner1",
            layers: ["top", "inner1"],
          },
        ],
      },
      {
        type: "pcb_trace",
        pcb_trace_id: "lower",
        connection_name: "DATA",
        route: [
          {
            route_type: "via",
            x: 0,
            y: 0,
            from_layer: "inner1",
            to_layer: "bottom",
            layers: ["inner1", "inner2", "bottom"],
          },
        ],
      },
    ],
  }
  const original = structuredClone(input)
  expect(
    getBusLanesInputFromSrj(input).connections[0].pointsToConnect[0].layers,
  ).toEqual(["inner2"])
  expect(
    getBusLanesInputFromSrj({ ...input, traces: input.traces!.toReversed() })
      .connections[0].pointsToConnect[0].layers,
  ).toEqual(["inner2"])
  const fromTop: SimpleRouteJson = {
    ...input,
    connections: [
      {
        ...input.connections[0],
        pointsToConnect: [
          { x: 0, y: 0, layer: "top" },
          { x: 3, y: 0, layer: "inner2" },
        ],
      },
    ],
  }
  expect(
    getBusLanesInputFromSrj(fromTop).connections[0].pointsToConnect[0].layers,
  ).toEqual(["inner2"])
  const disconnected: SimpleRouteJson = {
    ...fromTop,
    traces: [
      input.traces![0],
      {
        ...input.traces![1],
        route: [
          {
            route_type: "via",
            x: 0,
            y: 0,
            from_layer: "inner2",
            to_layer: "bottom",
            layers: ["inner2", "bottom"],
          },
        ],
      },
    ],
  }
  expect(
    getBusLanesInputFromSrj(disconnected).connections[0].pointsToConnect[0]
      .layers,
  ).toBeUndefined()
  const foreign: SimpleRouteJson = {
    ...fromTop,
    traces: [
      input.traces![0],
      { ...input.traces![1], connection_name: "OTHER" },
    ],
  }
  expect(
    getBusLanesInputFromSrj(foreign).connections[0].pointsToConnect[0].layers,
  ).toBeUndefined()
  const offset: SimpleRouteJson = {
    ...fromTop,
    traces: [
      input.traces![0],
      {
        ...input.traces![1],
        route: [
          {
            route_type: "via",
            x: 0.01,
            y: 0,
            from_layer: "inner1",
            to_layer: "bottom",
            layers: ["inner1", "inner2", "bottom"],
          },
        ],
      },
    ],
  }
  expect(
    getBusLanesInputFromSrj(offset).connections[0].pointsToConnect[0].layers,
  ).toBeUndefined()
  expect(input).toEqual(original)
})
