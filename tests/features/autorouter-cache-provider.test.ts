import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import {
  type AutorouterOptions,
  TscircuitAutorouter,
} from "lib/utils/autorouting/CapacityMeshAutorouter"

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
  const valuesByCacheKey = new Map<string, string>()
  const platformConfig = {
    localCacheEngine: {
      getItem: (cacheKey: string) => valuesByCacheKey.get(cacheKey) ?? null,
      setItem: (cacheKey: string, value: string) => {
        valuesByCacheKey.set(cacheKey, value)
      },
    },
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
  expect(pipelineCacheProviders[0]).not.toBeNull()
  expect(
    pipelineCacheProviders.every(
      (cacheProvider) => cacheProvider === pipelineCacheProviders[0],
    ),
  ).toBeTrue()
})
