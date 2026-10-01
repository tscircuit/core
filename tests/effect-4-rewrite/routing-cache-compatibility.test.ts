import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  cacheLocalAutoroutingPhaseResult,
  cacheLocalAutoroutingPhaseResultEffect,
  getCachedLocalAutoroutingPhaseResult,
  getCachedLocalAutoroutingPhaseResultEffect,
} from "lib/components/primitive-components/Group/Group_localAutoroutingCache"
import { LocalCacheEngineCacheProvider } from "lib/utils/autorouting/LocalCacheEngineCacheProvider"
import { createRoutingJob, routingInput } from "./routing-fixture"

test("Effect routing cache preserves public Promise values and rejects cancelled writes", async () => {
  const values = new Map<string, string>()
  const engine = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value)
    },
  }
  const result = { ...routingInput, traces: [] }
  await cacheLocalAutoroutingPhaseResult({
    cacheEngine: engine,
    cacheKey: "routes",
    result,
  })
  expect(
    await getCachedLocalAutoroutingPhaseResult({
      cacheEngine: engine,
      cacheKey: "routes",
    }),
  ).toEqual(result)
  expect(
    await Effect.runPromise(
      getCachedLocalAutoroutingPhaseResultEffect({
        cacheEngine: engine,
        cacheKey: "routes",
      }),
    ),
  ).toEqual(result)
  const controller = new AbortController()
  controller.abort()
  await Effect.runPromise(
    cacheLocalAutoroutingPhaseResultEffect({
      cacheEngine: engine,
      cacheKey: "cancelled",
      result,
      job: createRoutingJob(controller),
    }),
  )
  expect(values.has("cancelled")).toBe(false)
  values.set("corrupt", "bad json")
  expect(
    await getCachedLocalAutoroutingPhaseResult({
      cacheEngine: engine,
      cacheKey: "corrupt",
    }),
  ).toBeNull()
  const provider = new LocalCacheEngineCacheProvider(engine)
  await provider.setCachedSolution("node:key", { copper: [1, 2, 3] })
  expect(await provider.getCachedSolution("node:key")).toEqual({
    copper: [1, 2, 3],
  })
  expect(await provider.getCachedSolution("node:missing")).toBeUndefined()
  expect(provider.cacheHitsByPrefix.node).toBe(1)
  expect(provider.cacheMissesByPrefix.node).toBe(1)
})
