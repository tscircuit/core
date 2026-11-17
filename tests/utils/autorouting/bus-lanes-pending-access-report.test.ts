import { expect, test } from "bun:test"
import {
  BusLanesAutorouter,
  type BusLanesSolverEnded,
} from "lib/utils/autorouting/BusLanesAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("bus adapter reports accepted access from the real solver and preserves no-intent routes", () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    minTraceToPadEdgeClearance: 0.1,
    allowedLayers: ["top"],
    bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 },
    obstacles: [],
    connections: [
      {
        name: "active_signal",
        pointsToConnect: [
          { x: -1, y: -1, layer: "top" },
          { x: 1, y: -1, layer: "top" },
        ],
      },
    ],
    pendingRoutingAccess: [
      {
        minTraceWidth: 0.1,
        minTraceToPadEdgeClearance: 0.1,
        allowedLayers: ["top"],
        bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 },
        connections: [
          {
            name: "later_signal",
            pointsToConnect: [
              { x: -1, y: 1, layer: "top" },
              { x: 1, y: 1, layer: "top" },
            ],
          },
        ],
      },
    ],
  }
  const original = structuredClone(input)
  const ended: BusLanesSolverEnded[] = []
  const router = new BusLanesAutorouter(input, {
    onSolverEnded: (event) => ended.push(event),
  })
  const routes = router.solveSync()
  expect(routes).toHaveLength(1)
  expect(ended).toHaveLength(1)
  expect(ended[0]?.solved).toBe(true)
  expect(ended[0]?.failed).toBe(false)
  expect(ended[0]?.error).toBeNull()
  expect(ended[0]?.pendingRoutingAccessReport).toEqual({
    outcome: "preserved",
    declaredConnectionCount: 1,
    declaredTerminalCount: 2,
    framedTerminalCount: 0,
    baselineAccessibleFramedTerminalCount: 0,
    baselineInaccessibleFramedTerminalCount: 0,
    peerConnectionCount: 1,
    validatedTraceCount: 1,
    newlyBlockedConnectionNames: [],
  })
  // A repeated read of the same finished solver does not invent another end.
  expect(router.solveSync()).toEqual(routes)
  expect(ended).toHaveLength(1)
  expect(input).toEqual(original)

  const noIntent = structuredClone(input)
  delete noIntent.pendingRoutingAccess
  const noIntentEnded: BusLanesSolverEnded[] = []
  const legacyRouter = new BusLanesAutorouter(noIntent, {
    onSolverEnded: (event) => noIntentEnded.push(event),
  })
  expect(legacyRouter.solveSync()).toEqual(routes)
  expect(noIntentEnded).toHaveLength(1)
  expect(noIntentEnded[0]).not.toHaveProperty("pendingRoutingAccessReport")
})
