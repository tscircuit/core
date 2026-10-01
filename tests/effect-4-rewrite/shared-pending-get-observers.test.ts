import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { corePromise } from "lib/effect/core-error"
import {
  SharedRenderRegistry,
  type PendingSubcircuitRenders,
  type CachedSubcircuits,
} from "lib/effect/shared-render"

test("public pending getters observe consumers while internal guards protect replaced promises silently", async () => {
  const registry = new SharedRenderRegistry()
  const pending: PendingSubcircuitRenders = new Map()
  const cached: CachedSubcircuits = new Map()
  const getPending = pending.get.bind(pending)
  let consumerHits = 0
  pending.get = (propHash) => {
    const render = getPending(propHash)
    if (render) consumerHits++
    return render
  }
  const firstCompletion = Promise.withResolvers<AnyCircuitElement[]>()
  const request = {
    propHash: "observed-consumers",
    pendingSubcircuitRenders: pending,
    cachedSubcircuits: cached,
    render: () => corePromise(() => firstCompletion.promise),
  }
  const producer = registry.acquire(request)
  const consumer = registry.acquire(request)
  firstCompletion.resolve([])
  await consumer.result
  await producer.release()
  await consumer.release()
  expect(consumerHits).toBe(1)
  expect(pending.size).toBe(0)
  expect(cached.size).toBe(1)

  const staleCompletion = Promise.withResolvers<AnyCircuitElement[]>()
  const replacement = Promise.withResolvers<AnyCircuitElement[]>()
  const stale = registry.acquire({
    ...request,
    propHash: "observed-replacement",
    render: () => corePromise(() => staleCompletion.promise),
  })
  pending.set("observed-replacement", replacement.promise)
  staleCompletion.resolve([])
  await stale.result
  await stale.release()
  expect(consumerHits).toBe(1)
  expect(getPending("observed-replacement")).toBe(replacement.promise)
  expect(cached.has("observed-replacement")).toBe(false)
})
