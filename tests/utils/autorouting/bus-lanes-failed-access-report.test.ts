import { expect, test } from "bun:test"
import {
  BusLanesAutorouter,
  type BusLanesSolverEnded,
} from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("failed actual bus routing emits one ended event without an accepted report", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    minTraceToPadEdgeClearance: 0.1,
    buses: [
      {
        busId: "current_bus",
        connectionNames: ["blocked_signal"],
        traceWidth: 0.1,
        allowedLayers: ["top"],
      },
    ],
    bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 },
    obstacles: [
      {
        type: "rect",
        center: { x: 0, y: 0 },
        width: 6,
        height: 6,
        layers: ["top", "bottom"],
        connectedTo: ["ground"],
      },
    ],
    connections: [
      {
        name: "blocked_signal",
        pointsToConnect: [
          { x: -1, y: 0, layer: "top" },
          { x: 1, y: 0, layer: "top" },
        ],
      },
    ],
  }
  const ended: BusLanesSolverEnded[] = []
  const router = new BusLanesAutorouter(input, {
    onSolverEnded: (event) => ended.push(event),
  })
  expect(() => router.solveSync()).toThrow()
  expect(ended).toHaveLength(1)
  expect(ended[0]?.solved).toBe(false)
  expect(ended[0]?.failed).toBe(true)
  expect(ended[0]?.error).toBeTruthy()
  expect(ended[0]).not.toHaveProperty("pendingRoutingAccessReport")
})
