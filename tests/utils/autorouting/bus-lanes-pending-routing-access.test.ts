import { expect, test } from "bun:test"
import {
  BusLanesAutorouter,
  type BusLanesSolverStarted,
} from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("bus adapter observes future intent on the actual constructed solver", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    minTraceToPadEdgeClearance: 0.1,
    bounds: { minX: -4, maxX: 4, minY: -3, maxY: 3 },
    obstacles: [],
    connections: [
      {
        name: "active_signal",
        pointsToConnect: [
          { x: -2, y: -1, layer: "top" },
          { x: 2, y: -1, layer: "top" },
        ],
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "saved_conductor",
        connection_name: "saved_signal",
        route: [
          { route_type: "wire", x: -3, y: 2, layer: "top", width: 0.2 },
          {
            route_type: "through_obstacle",
            start: { x: -2, y: 2 },
            end: { x: -1, y: 2 },
            from_layer: "top",
            to_layer: "bottom",
            width: 0.2,
          },
          { route_type: "wire", x: 0, y: 2, layer: "bottom", width: 0.2 },
        ],
      },
    ],
    pendingRoutingAccess: [
      {
        minTraceWidth: 0.22,
        minTraceToPadEdgeClearance: 0.18,
        minTraceToHoleEdgeClearance: 0.21,
        minViaEdgeToPadEdgeClearance: 0.2,
        minViaPadDiameter: 0.6,
        minViaHoleDiameter: 0.3,
        minBoardEdgeClearance: 0.15,
        allowViaInPad: false,
        allowBlindAndBuriedVias: false,
        allowedLayers: ["bottom"],
        bounds: { minX: -3, maxX: 3, minY: -2, maxY: 2 },
        connections: [
          {
            name: "future_signal",
            nominalTraceWidth: 0.24,
            pointsToConnect: [
              { x: -1, y: 1, layer: "top" },
              { x: 1, y: 1, layer: "top" },
            ],
          },
        ],
        buses: [
          {
            busId: "future_bus",
            connectionNames: ["future_signal"],
            traceWidth: 0.27,
            allowedLayers: ["bottom"],
          },
        ],
      },
    ],
  }
  const original = structuredClone(input)
  const started: BusLanesSolverStarted[] = []
  new BusLanesAutorouter(input, {
    onSolverStarted: (details) => started.push(details),
  })

  expect(started).toHaveLength(1)
  const actual = started[0]!
  expect(actual.solverName).toBe("BusLanesPipelineSolver")
  expect(actual.solverParams).not.toBe(input)
  expect(actual.solverConstructorArgs[0]).toBe(actual.solverParams)
  expect(actual.solverParams.pendingRoutingAccess).toEqual(
    original.pendingRoutingAccess,
  )
  // The actual constructor sees the adapter's two physical layer fragments,
  // while a pre-adapter announcement would still contain through_obstacle.
  expect(actual.solverParams.traces).toHaveLength(2)
  expect(
    actual.solverParams.traces?.flatMap((trace) =>
      trace.route.map((point) => point.route_type),
    ),
  ).toEqual(["wire", "wire", "wire", "wire", "wire"])
  expect(input).toEqual(original)

  const rejectedStarts: BusLanesSolverStarted[] = []
  expect(
    () =>
      new BusLanesAutorouter(
        { ...input, layerCount: 0 },
        { onSolverStarted: (details) => rejectedStarts.push(details) },
      ),
  ).toThrow()
  expect(rejectedStarts).toHaveLength(0)
})
