import { test, expect } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

// Create a simple route test fixture
const createTestSimpleRouteJson = (): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [
    // Create a rectangular obstacle in the center
    {
      type: "rect",
      layers: ["top", "bottom"],
      center: { x: 0, y: 0 },
      width: 5,
      height: 5,
      connectedTo: [],
    },
  ],
  connections: [
    // Create a connection that needs to go around the obstacle
    {
      name: "conn1",
      pointsToConnect: [
        { x: -10, y: 0, layer: "top" },
        { x: 10, y: 0, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -15, maxX: 15, minY: -15, maxY: 15 },
})

test("CapacityMeshAutorouter should solve a simple routing problem", () => {
  const autorouter = new TscircuitAutorouter(createTestSimpleRouteJson())

  // Execute the sync solve method
  const traces = autorouter.solveSync()

  // Validate basic expectations about the result
  expect(traces.length).toBeGreaterThan(0)
  expect(traces[0].type).toBe("pcb_trace")
  expect(traces[0].route.length).toBeGreaterThan(2)

  // The first and last points should match our input
  const route = traces[0].route
  const firstPoint = route[0] as { x: number; y: number; layer: string }
  const lastPoint = route[route.length - 1] as {
    x: number
    y: number
    layer: string
  }

  // Check that the endpoints match our input points, regardless of order
  expect([firstPoint.x, lastPoint.x].sort()).toEqual([-10, 10])
  expect(firstPoint.y).toBeCloseTo(0, 0)
  expect(lastPoint.y).toBeCloseTo(0, 0)
})

test("CapacityMeshAutorouter invokes onSolverStarted callback", () => {
  const simpleRouteJson = createTestSimpleRouteJson()
  let solverDetails: any

  new TscircuitAutorouter(simpleRouteJson, {
    onSolverStarted: (details) => {
      solverDetails = details
    },
  })

  expect(solverDetails?.solverName).toBeDefined()
  expect(solverDetails?.solverParams).toMatchObject({
    input: simpleRouteJson,
    options: expect.objectContaining({
      cacheProvider: null,
    }),
  })
})
