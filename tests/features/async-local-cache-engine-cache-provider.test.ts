import { expect, test } from "bun:test"
import type { CacheProvider } from "@tscircuit/capacity-autorouter"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("async local cache engines expose an async autorouter cache provider", async () => {
  const cachedValues = new Map<string, string>()
  const localCacheEngine = {
    getItem: async (cacheKey: string) => cachedValues.get(cacheKey) ?? null,
    setItem: async (cacheKey: string, value: string) => {
      cachedValues.set(cacheKey, value)
    },
  }
  let cacheProvider: CacheProvider | null = null
  new TscircuitAutorouter(
    {
      layerCount: 2,
      minTraceWidth: 0.2,
      obstacles: [],
      connections: [],
      bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
    } as SimpleRouteJson,
    {
      autorouterVersion: "beta_pipeline9",
      platformConfig: { localCacheEngine },
      onSolverStarted: (details) => {
        cacheProvider = details.solverParams.options.cacheProvider
      },
    },
  )

  expect(cacheProvider).not.toBeNull()
  expect(cacheProvider!.isSyncCache).toBeFalse()
  await cacheProvider!.setCachedSolution("async-prefix:key", { value: 456 })
  expect(await cacheProvider!.getCachedSolution("async-prefix:key")).toEqual({
    value: 456,
  })
})
