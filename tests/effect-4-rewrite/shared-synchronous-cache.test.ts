import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("a synchronously completing shared worker caches and releases its entry", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cache = new Map<string, AnyCircuitElement[]>()
  const json: AnyCircuitElement[] = []
  let calls = 0
  const request = {
    propHash: "sync-subcircuit",
    pendingSubcircuitRenders: pending,
    cachedSubcircuits: cache,
    render: () => {
      calls++
      return Effect.succeed(json)
    },
  }
  const first = registry.acquire(request)
  expect(await first.result).toBe(json)
  expect(cache.get("sync-subcircuit")).toBe(json)
  const second = registry.acquire(request)
  expect(await second.result).toBe(json)
  expect(calls).toBe(1)
  expect(pending.size).toBe(0)
  await first.release()
  await second.release()
})
