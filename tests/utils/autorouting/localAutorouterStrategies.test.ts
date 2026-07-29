import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getLocalAutorouterStrategy } from "lib/utils/autorouting/localAutorouterStrategies"

test("the default local autorouter strategy preserves existing behavior", () => {
  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [],
    connections: [],
    bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
  }
  const strategy = getLocalAutorouterStrategy("default")
  const autorouter = strategy.create({
    simpleRouteJson,
    commonAutorouterOptions: {},
  })

  expect(strategy.cacheable).toBe(true)
  expect(autorouter).toBeInstanceOf(TscircuitAutorouter)
  expect(autorouter.input).toBe(simpleRouteJson)
})
