import { expect, test } from "bun:test"
import type { CacheProvider } from "@tscircuit/capacity-autorouter"
import {
  type AutorouterOptions,
  TscircuitAutorouter,
} from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

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

test("platform cache gates the provider supplied to every local pipeline", () => {
  const cachedValues = new Map<string, string>()
  const localCacheEngine = {
    getItem: (cacheKey: string) => cachedValues.get(cacheKey) ?? null,
    setItem: (cacheKey: string, value: string) => {
      cachedValues.set(cacheKey, value)
    },
  }
  const platformConfig = {
    localCacheEngine,
  }
  let implicitPipeline9CacheProvider: unknown
  new TscircuitAutorouter(structuredClone(simpleRouteJson), {
    autorouterVersion: "beta_pipeline9",
    onSolverStarted: (details) => {
      implicitPipeline9CacheProvider =
        details.solverParams.options.cacheProvider
    },
  })
  expect(implicitPipeline9CacheProvider).toBeNull()

  const pipelineOptions: AutorouterOptions[] = [
    {},
    { autorouterVersion: "v1" },
    { autorouterVersion: "v3" },
    { autorouterVersion: "v4" },
    { autorouterVersion: "v5" },
    { autorouterVersion: "v6" },
    { autorouterVersion: "latest" },
    { autorouterVersion: "beta_pipeline9" },
    { useAssignableSolver: true },
    { useAutoJumperSolver: true },
    { useLaserPrefabSolver: true },
  ]
  const pipelineCacheProviders = pipelineOptions.map((pipelineOption) => {
    let solverCacheProvider: unknown
    new TscircuitAutorouter(structuredClone(simpleRouteJson), {
      ...pipelineOption,
      platformConfig,
      onSolverStarted: (details) => {
        solverCacheProvider = details.solverParams.options.cacheProvider
      },
    })
    return solverCacheProvider
  })

  expect(pipelineCacheProviders).toHaveLength(pipelineOptions.length)
  const cacheProvider = pipelineCacheProviders[0] as CacheProvider
  expect(cacheProvider).not.toBeNull()
  expect(
    pipelineCacheProviders.every(
      (cacheProvider) => cacheProvider === pipelineCacheProviders[0],
    ),
  ).toBeTrue()
  cacheProvider.setCachedSolutionSync("test-prefix:key", { value: 123 })
  expect(cacheProvider.getCachedSolutionSync("test-prefix:key")).toEqual({
    value: 123,
  })
  expect(cachedValues.size).toBe(1)
  expect(cacheProvider.cacheHitsByPrefix["test-prefix"]).toBe(1)
})
