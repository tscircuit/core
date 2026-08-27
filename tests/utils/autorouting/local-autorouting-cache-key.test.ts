import { expect, test } from "bun:test"
import {
  getLocalAutoroutingCacheKey,
  type LocalAutoroutingCacheConfig,
} from "lib/components/primitive-components/Group/Group_localAutoroutingCache"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const simpleRouteJson: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [],
  connections: [],
  bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
}

test("local autorouting cache keys include solver and capacity options", () => {
  const baseConfig: LocalAutoroutingCacheConfig = {
    solverName: "AutoroutingPipelineSolver7_MultiGraph",
  }
  const getKey = (config: LocalAutoroutingCacheConfig) =>
    getLocalAutoroutingCacheKey(simpleRouteJson, config)

  expect(getKey(baseConfig)).toBe(getKey({ ...baseConfig }))
  expect(
    new Set([
      getKey(baseConfig),
      getKey({
        ...baseConfig,
        solverName: "AutoroutingPipelineSolver9_PreloadedTraceGraph",
      }),
      getKey({ ...baseConfig, capacityDepth: 6 }),
      getKey({ ...baseConfig, targetMinCapacity: 0.7 }),
      getKey({ ...baseConfig, effort: 2 }),
    ]).size,
  ).toBe(5)
})
