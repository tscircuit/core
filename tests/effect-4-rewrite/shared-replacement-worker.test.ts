import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import type { AnyCircuitElement } from "circuit-json"
import { corePromise } from "lib/effect/core-error"
import { SharedRenderRegistry } from "lib/effect/shared-render"

test("an interrupted old worker's delayed finalizer cannot remove or cache over its replacement", async () => {
  const registry = new SharedRenderRegistry()
  const pending = new Map<string, Promise<AnyCircuitElement[]>>()
  const cache = new Map<string, AnyCircuitElement[]>()
  const cleanup = Promise.withResolvers<void>()
  const replacementResult = Promise.withResolvers<AnyCircuitElement[]>()
  const first = registry.acquire({
    propHash: "replacement",
    pendingSubcircuitRenders: pending,
    cachedSubcircuits: cache,
    render: () =>
      Effect.scoped(
        Effect.gen(function* () {
          yield* Effect.acquireRelease(Effect.void, () =>
            Effect.promise(() => cleanup.promise),
          )
          return yield* corePromise<AnyCircuitElement[]>(
            () => new Promise(() => {}),
          )
        }),
      ),
  })
  const release = first.release()
  expect(first.release()).toBe(release)
  const second = registry.acquire({
    propHash: "replacement",
    pendingSubcircuitRenders: pending,
    cachedSubcircuits: cache,
    render: () => corePromise(() => replacementResult.promise),
  })
  cleanup.resolve()
  await release
  expect(pending.get("replacement")).toBe(second.result)
  expect(cache.size).toBe(0)
  const json: AnyCircuitElement[] = []
  replacementResult.resolve(json)
  expect(await second.result).toBe(json)
  expect(cache.get("replacement")).toBe(json)
  await second.release()
})
