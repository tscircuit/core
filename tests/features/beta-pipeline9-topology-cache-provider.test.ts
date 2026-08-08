import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

const simpleRouteJson: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [],
  connections: [
    {
      name: "test_connection",
      pointsToConnect: [
        { x: -1, y: 0, layer: "top" },
        { x: 1, y: 0, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
}

test("beta_pipeline9 autorouters share the global in-memory cache provider", () => {
  const cacheProviders = [0, 1].map(() => {
    let cacheProvider: unknown
    new TscircuitAutorouter(structuredClone(simpleRouteJson), {
      autorouterVersion: "beta_pipeline9",
      onSolverStarted: (details) => {
        cacheProvider = details.solverParams.options.cacheProvider
      },
    })
    return cacheProvider
  })

  expect(cacheProviders[0]).toBeDefined()
  expect(cacheProviders[1]).toBe(cacheProviders[0])
})
